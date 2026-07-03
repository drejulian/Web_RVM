import mqtt from 'mqtt';
import { PrismaClient } from '@prisma/client';
import { broadcastBottleDetection } from '../lib/socket.js';

const prisma = new PrismaClient();

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  connect() {
    const options = {
      host: process.env.MQTT_BROKER,
      port: parseInt(process.env.MQTT_PORT || '1883'),
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clientId: process.env.MQTT_CLIENT_ID || 'web_rvm_server',
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
    };

    console.log('🔌 Connecting to MQTT broker:', options.host);

    this.client = mqtt.connect(`mqtt://${options.host}:${options.port}`, options);

    this.client.on('connect', () => {
      console.log('✅ MQTT Connected to HiveMQ!');
      this.isConnected = true;
      this.subscribeToTopics();
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT Error:', error.message);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('🔌 MQTT Connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnect', () => {
      console.log('🔄 MQTT Reconnecting...');
    });

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message);
    });
  }

  subscribeToTopics() {
    const topics = [
      'rvm/device/+/bottles',
      'rvm/device/+/status',
      'rvm/device/+/session/request',
    ];

    topics.forEach((topic) => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`❌ Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`📡 Subscribed to: ${topic}`);
        }
      });
    });
  }

  async handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());
      console.log(`📩 MQTT [${topic}]:`, payload);

      if (topic.includes('/bottles')) {
        await this.handleBottleDetection(payload);
      } else if (topic.includes('/session/request')) {
        await this.handleSessionRequest(payload);
      } else if (topic.includes('/status')) {
        await this.handleDeviceStatus(payload);
      }
    } catch (error) {
      console.error('❌ Error handling MQTT message:', error.message);
    }
  }

  async handleBottleDetection(payload) {
    try {
      const { deviceId, bottleCount, userId, rvmLocationId, distance } = payload;

      if (!deviceId || !rvmLocationId) {
        console.error('❌ Missing required fields: deviceId, rvmLocationId');
        return;
      }

      const location = await prisma.rvmLocation.findUnique({
        where: { id: parseInt(rvmLocationId) },
      });

      if (!location) {
        console.error(`❌ Location ${rvmLocationId} not found`);
        return;
      }

      let newRecord;
      const bottleCountValue = parseInt(bottleCount) || 1;
      const distanceValue = parseFloat(distance) || 0;

      if (userId) {
        console.log('👤 Direct assignment mode - userId:', userId);

        let userBottleCount = await prisma.userBottleCount.findUnique({
          where: { userId },
        });

        if (!userBottleCount) {
          userBottleCount = await prisma.userBottleCount.create({
            data: {
              userId,
              totalBottles: 0,
              redeemableCount: 0,
              lifetimeCount: 0,
              points: 0,
              lifetimePoints: 0,
            },
          });
        }

        newRecord = await prisma.bottleCount.create({
          data: {
            deviceId,
            count: bottleCountValue,
            distance: distanceValue,
            source: 'arduino_mqtt',
            timestamp: new Date(),
            userBottleCountId: userBottleCount.id,
          },
        });

        const pointsPerBottle = 50;
        const pointsEarned = bottleCountValue * pointsPerBottle;

        await prisma.userBottleCount.update({
          where: { id: userBottleCount.id },
          data: {
            totalBottles: { increment: bottleCountValue },
            redeemableCount: { increment: bottleCountValue },
            lifetimeCount: { increment: bottleCountValue },
            points: { increment: pointsEarned },
            lifetimePoints: { increment: pointsEarned },
          },
        });

        await prisma.bottleTransaction.create({
          data: {
            userBottleCountId: userBottleCount.id,
            deviceId,
            locationId: parseInt(rvmLocationId),
            transactionType: 'DEPOSIT',
            bottleCount: bottleCountValue,
            pointsEarned,
            timestamp: new Date(),
          },
        });

        console.log(`✅ Bottle assigned to user: ${userId}, Points: ${pointsEarned}`);
      } else {
        console.log('📝 Unclaimed mode - saving for BottleIn');

        newRecord = await prisma.bottleCount.create({
          data: {
            deviceId,
            count: bottleCountValue,
            distance: distanceValue,
            source: 'arduino_mqtt',
            timestamp: new Date(),
          },
        });
      }

      const totalUnclaimedBottles = await prisma.bottleCount.aggregate({
        where: { userBottleCountId: null },
        _sum: { count: true },
      });

      const totalBottles = totalUnclaimedBottles._sum.count || 0;

      const realtimeData = {
        deviceId,
        bottleCount: bottleCountValue,
        totalUnclaimedBottles: totalBottles,
        distance: distanceValue,
        locationName: location.name,
        recordId: newRecord.id,
        timestamp: newRecord.timestamp,
      };

      broadcastBottleDetection(realtimeData);

      this.sendConfirmation(deviceId, {
        success: true,
        recordId: newRecord.id,
        bottleCount: bottleCountValue,
        totalUnclaimedBottles: totalBottles,
        timestamp: Date.now(),
      });

      console.log(`✅ Bottle detection processed - Record ID: ${newRecord.id}`);
    } catch (error) {
      console.error('❌ handleBottleDetection error:', error.message);
    }
  }

  async handleSessionRequest(payload) {
    try {
      const { deviceId } = payload;

      if (!deviceId) {
        console.error('❌ Missing deviceId in session request');
        return;
      }

      const activeSession = await prisma.arduinoSession.findFirst({
        where: {
          deviceId,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      });

      const response = {
        success: true,
        deviceId,
        userId: activeSession?.userId || null,
        sessionId: activeSession?.id || null,
        expiresAt: activeSession?.expiresAt?.toISOString() || null,
        timestamp: Date.now(),
      };

      this.publishToDevice(deviceId, 'session/response', response);

      if (activeSession) {
        console.log(`✅ Active session found for ${deviceId}: User ${activeSession.userId}`);
      } else {
        console.log(`💤 No active session for ${deviceId}`);
      }
    } catch (error) {
      console.error('❌ handleSessionRequest error:', error.message);
    }
  }

  async handleDeviceStatus(payload) {
    try {
      const { deviceId, status, uptime, wifiRSSI } = payload;

      if (!deviceId) {
        console.error('❌ Missing deviceId in status update');
        return;
      }

      await prisma.arduinoConnection.upsert({
        where: { deviceId },
        update: {
          status: status || 'online',
          lastPing: new Date(),
          ipAddress: 'mqtt',
        },
        create: {
          deviceId,
          locationId: 1,
          status: status || 'online',
          lastPing: new Date(),
          ipAddress: 'mqtt',
        },
      });

      console.log(`📊 Device status: ${deviceId} - ${status} (uptime: ${uptime}s, RSSI: ${wifiRSSI})`);
    } catch (error) {
      console.error('❌ handleDeviceStatus error:', error.message);
    }
  }

  sendConfirmation(deviceId, data) {
    this.publishToDevice(deviceId, 'confirmation', data);
  }

  publishToDevice(deviceId, subtopic, data) {
    const topic = `rvm/server/${deviceId}/${subtopic}`;
    const message = JSON.stringify(data);

    if (this.isConnected && this.client) {
      this.client.publish(topic, message, { qos: 1 }, (err) => {
        if (err) {
          console.error(`❌ Failed to publish to ${topic}:`, err.message);
        } else {
          console.log(`📤 Published to ${topic}`);
        }
      });
    } else {
      console.error('❌ MQTT client not connected, cannot publish');
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      console.log('🔌 MQTT Disconnected');
    }
  }
}

export default new MQTTService();
