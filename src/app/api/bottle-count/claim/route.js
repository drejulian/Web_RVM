import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma.js';
import jwt from 'jsonwebtoken';

// Helper function untuk verifikasi token
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// POST /api/bottle-count/claim - Claim unclaimed bottle detections
export async function POST(request) {
  try {
    console.log('=== Bottle Claim API Called ===');

    const body = await request.json();
    const { detectionIds, claimAll = false } = body;

    // Get userId from token
    const token = request.cookies.get('token')?.value;
    let userId = null;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        userId = decoded.userId;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('👤 User claiming bottles:', userId);
    console.log(
      '🎯 Claim mode:',
      claimAll ? 'All unclaimed' : 'Specific detections'
    );
    if (detectionIds) {
      console.log('📝 Detection IDs:', detectionIds);
    }

    // Start transaction untuk atomicity dengan timeout lebih besar
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Cek apakah user ada
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new Error(`User not found: ${userId}`);
        }

        // 2. Ambil atau buat UserBottleCount untuk user
        let userBottleCount = await tx.userBottleCount.findUnique({
          where: { userId },
        });

        if (!userBottleCount) {
          userBottleCount = await tx.userBottleCount.create({
            data: {
              userId,
              totalBottles: 0,
              redeemableCount: 0,
              lifetimeCount: 0,
              points: 0,
              lifetimePoints: 0,
            },
          });
          console.log('✅ Created new UserBottleCount for user');
        }

        // 3. Get unclaimed detections
        let whereClause = {
          userBottleCountId: null, // Unclaimed
          source: 'arduino_mqtt', // Only MQTT source (Arduino sends via MQTT only)
        };

        if (!claimAll && detectionIds && detectionIds.length > 0) {
          whereClause.id = { in: detectionIds };
        }

        const unclaimedDetections = await tx.bottleCount.findMany({
          where: whereClause,
          orderBy: { timestamp: 'asc' },
          take: claimAll ? 20 : undefined, // Limit untuk mencegah timeout
        });

        if (unclaimedDetections.length === 0) {
          return {
            claimedCount: 0,
            totalBottles: 0,
            pointsEarned: 0,
            userBottleCount,
            message: 'No unclaimed detections found',
          };
        }

        console.log(
          `📦 Found ${unclaimedDetections.length} unclaimed detections`
        );

        // 4. Calculate totals
        const totalBottles = unclaimedDetections.reduce(
          (sum, detection) => sum + detection.count,
          0
        );
        const pointsPerBottle = 50;
        const totalPoints = totalBottles * pointsPerBottle;

        // 5. Update detections to assign to user
        console.log(
          `🔄 Updating ${unclaimedDetections.length} bottle detections...`
        );
        const detectionIdsToUpdate = unclaimedDetections.map((d) => d.id);
        await tx.bottleCount.updateMany({
          where: { id: { in: detectionIdsToUpdate } },
          data: { userBottleCountId: userBottleCount.id },
        });
        console.log(`✅ Bottle detections updated successfully`);

        // 6. Update UserBottleCount
        console.log(
          `📊 Updating user bottle count: +${totalBottles} bottles, +${totalPoints} points`
        );
        const updatedUserBottleCount = await tx.userBottleCount.update({
          where: { id: userBottleCount.id },
          data: {
            totalBottles: { increment: totalBottles },
            redeemableCount: { increment: totalBottles },
            lifetimeCount: { increment: totalBottles },
            points: { increment: totalPoints },
            lifetimePoints: { increment: totalPoints },
            lastUpdated: new Date(),
          },
        });
        console.log(`✅ User bottle count updated successfully`);

        // 7. Create ONE grouped transaction for all claimed bottles
        console.log(
          `📝 Creating 1 grouped transaction for ${totalBottles} bottles...`
        );
        
        const transaction = await tx.bottleTransaction.create({
          data: {
            userBottleCountId: userBottleCount.id,
            deviceId: unclaimedDetections[0].deviceId,
            transactionType: 'DEPOSIT',
            bottleCount: totalBottles,
            pointsEarned: totalPoints,
            timestamp: unclaimedDetections[0].timestamp,
          },
        });

        // 8. Link all claimed bottles to this transaction
        await tx.bottleCount.updateMany({
          where: {
            id: { in: unclaimedDetections.map(d => d.id) },
          },
          data: {
            bottleTransactionId: transaction.id,
          },
        });

        console.log(`✅ Grouped transaction created: ${transaction.id} with ${totalBottles} bottles`);

        return {
          claimedCount: unclaimedDetections.length,
          totalBottles,
          pointsEarned: totalPoints,
          userBottleCount: updatedUserBottleCount,
          claimedDetections: unclaimedDetections.map((d) => ({
            id: d.id,
            deviceId: d.deviceId,
            count: d.count,
            timestamp: d.timestamp,
          })),
        };
      },
      {
        timeout: 20000, // 20 detik timeout
      }
    );

    // Broadcast bottles claimed event to ALL clients for real-time update
    console.log('🔍 DEBUG: Broadcasting bottles_claimed, global.io exists?', !!global.io);
    if (global.io && result.claimedCount > 0) {
      const firstDetection = result.claimedDetections[0];
      global.io.emit('bottles_claimed', {
        type: 'bottles_claimed',
        userId,
        deviceId: firstDetection?.deviceId,
        claimedCount: result.claimedCount,
        bottlesAdded: result.totalBottles,
        pointsEarned: result.pointsEarned,
        timestamp: new Date().toISOString()
      });
      console.log('📡 Broadcasted bottles_claimed event to ALL clients');
    } else if (!global.io) {
      console.error('❌ global.io is undefined - Socket.io not available for broadcast!');
    }

    console.log('✅ Claim transaction completed:', {
      userId,
      claimedCount: result.claimedCount,
      totalBottles: result.totalBottles,
      pointsEarned: result.pointsEarned,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully claimed ${result.claimedCount} bottle detections`,
      data: {
        userId,
        claimedCount: result.claimedCount,
        bottlesAdded: result.totalBottles,
        pointsEarned: result.pointsEarned,
        newTotals: {
          totalBottles: result.userBottleCount.totalBottles,
          redeemableCount: result.userBottleCount.redeemableCount,
          points: result.userBottleCount.points,
          lifetimePoints: result.userBottleCount.lifetimePoints,
        },
        claimedDetections: result.claimedDetections,
      },
    });
  } catch (error) {
    console.error('❌ Error claiming bottles:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET /api/bottle-count/claim - Get unclaimed detections
export async function GET() {
  try {
    console.log('=== Get Unclaimed Detections API Called ===');

    // Get all unclaimed detections
    const unclaimedDetections = await prisma.bottleCount.findMany({
      where: {
        userBottleCountId: null, // Unclaimed
        source: 'arduino_mqtt', // Only MQTT source (Arduino sends via MQTT only)
      },
      orderBy: { timestamp: 'desc' },
      take: 50, // Limit untuk performance
      select: {
        id: true,
        deviceId: true,
        count: true,
        distance: true,
        timestamp: true,
        source: true,
      },
    });

    // Get total stats
    const totalUnclaimedCount = await prisma.bottleCount.count({
      where: {
        userBottleCountId: null,
        source: 'arduino_mqtt', // Only MQTT source (Arduino sends via MQTT only)
      },
    });

    const totalUnclaimedBottles = await prisma.bottleCount.aggregate({
      where: {
        userBottleCountId: null,
        source: 'arduino_mqtt', // Only MQTT source (Arduino sends via MQTT only)
      },
      _sum: { count: true },
    });

    // Group by device for stats
    const deviceStats = await prisma.bottleCount.groupBy({
      by: ['deviceId'],
      where: {
        userBottleCountId: null,
        source: 'arduino_mqtt', // Only MQTT source (Arduino sends via MQTT only)
      },
      _sum: { count: true },
      _count: { id: true },
    });

    console.log(`📊 Found ${totalUnclaimedCount} unclaimed detections`);

    return NextResponse.json({
      success: true,
      data: {
        totalUnclaimedDetections: totalUnclaimedCount,
        totalUnclaimedBottles: totalUnclaimedBottles._sum.count || 0,
        estimatedPoints: (totalUnclaimedBottles._sum.count || 0) * 50,
        detections: unclaimedDetections,
        deviceStats: deviceStats.map((stat) => ({
          deviceId: stat.deviceId,
          detectionCount: stat._count.id,
          bottleCount: stat._sum.count,
        })),
      },
    });
  } catch (error) {
    console.error('❌ Error getting unclaimed detections:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
