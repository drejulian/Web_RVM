import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function POST(request) {
  try {
    console.log('=== End Session API Called ===');

    const body = await request.json();
    const { deviceId } = body;

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

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'deviceId is required' },
        { status: 400 }
      );
    }

    console.log('🔒 Ending session for user:', userId);
    console.log('🏭 Device:', deviceId);

    const activeSessions = await prisma.arduinoSession.findMany({
      where: { 
        deviceId, 
        userId,
        isActive: true 
      },
      include: {
        device: {
          select: {
            locationId: true,
          },
        },
      },
    });

    if (activeSessions.length === 0) {
      console.log('💤 No active sessions found to end');
      return NextResponse.json({
        success: true,
        message: 'No active sessions to end',
      });
    }

    const userBottleCount = await prisma.userBottleCount.findUnique({
      where: { userId },
    });

    if (!userBottleCount) {
      console.log(`⚠️ No UserBottleCount found for user ${userId}`);
      return NextResponse.json({
        success: false,
        error: 'User bottle count not found',
      }, { status: 404 });
    }

    const bottleRecords = await prisma.bottleCount.findMany({
      where: {
        userBottleCountId: userBottleCount.id,
        deviceId,
        bottleTransactionId: null,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    let totalTransactionsCreated = 0;
    let totalBottlesProcessed = 0;

    if (bottleRecords.length > 0) {
      const totalBottles = bottleRecords.reduce((sum, record) => sum + record.count, 0);
      const pointsEarned = totalBottles * 50;
      
      console.log(`📊 Creating grouped transaction for ALL pending bottles: ${totalBottles} bottles, ${pointsEarned} points`);

      const locationId = activeSessions[0]?.device?.locationId || null;

      const transaction = await prisma.bottleTransaction.create({
        data: {
          userBottleCountId: userBottleCount.id,
          deviceId,
          locationId,
          transactionType: 'DEPOSIT',
          bottleCount: totalBottles,
          pointsEarned,
          timestamp: bottleRecords[0].timestamp,
        },
      });

      await prisma.bottleCount.updateMany({
        where: {
          id: { in: bottleRecords.map(r => r.id) },
        },
        data: {
          bottleTransactionId: transaction.id,
        },
      });

      totalTransactionsCreated = 1;
      totalBottlesProcessed = totalBottles;
      
      console.log(`✅ Transaction created: ${transaction.id} with ${totalBottles} bottles`);
    } else {
      console.log(`📭 No pending bottles found for this session`);
    }

    const updated = await prisma.arduinoSession.updateMany({
      where: { 
        deviceId, 
        userId,
        isActive: true 
      },
      data: { isActive: false },
    });

    console.log(`✅ ${updated.count} session(s) deactivated`);
    console.log(`📦 Created ${totalTransactionsCreated} grouped transaction(s)`);
    console.log(`🍾 Processed ${totalBottlesProcessed} bottles`);
    
    if (global.io) {
      global.io.emit('session_ended', {
        type: 'session_ended',
        deviceId,
        userId,
        transactionsCreated: totalTransactionsCreated,
        bottlesProcessed: totalBottlesProcessed,
        timestamp: new Date().toISOString(),
      });
      console.log('📡 Broadcasted session_ended event to ALL clients');
    }

    return NextResponse.json({
      success: true,
      message: 'Session ended successfully',
      data: {
        deviceId,
        sessionsEnded: updated.count,
        transactionsCreated: totalTransactionsCreated,
        bottlesProcessed: totalBottlesProcessed,
      },
    });
  } catch (error) {
    console.error('❌ Error ending session:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
