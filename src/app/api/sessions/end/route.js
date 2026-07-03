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

    const updated = await prisma.arduinoSession.updateMany({
      where: { 
        deviceId, 
        userId,
        isActive: true 
      },
      data: { isActive: false },
    });

    if (updated.count > 0) {
      console.log(`✅ ${updated.count} session(s) deactivated`);
      
      if (global.io) {
        global.io.to('bottle-detection').emit('session_ended', {
          deviceId,
          userId,
          timestamp: new Date().toISOString(),
        });
        console.log('📡 Broadcasted session_ended event via Socket.IO');
      }

      return NextResponse.json({
        success: true,
        message: 'Session ended successfully',
        data: {
          deviceId,
          sessionsEnded: updated.count,
        },
      });
    } else {
      console.log('💤 No active sessions found to end');
      return NextResponse.json({
        success: true,
        message: 'No active sessions to end',
      });
    }
  } catch (error) {
    console.error('❌ Error ending session:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
