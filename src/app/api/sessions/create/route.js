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
    console.log('=== Create Session API Called ===');

    const body = await request.json();
    const { deviceId, expiresInMinutes = 5 } = body;

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

    const device = await prisma.arduinoConnection.findUnique({
      where: { deviceId },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!device) {
      return NextResponse.json(
        {
          success: false,
          error: `Device ${deviceId} is not registered. Register the device in the admin dashboard first.`,
        },
        { status: 404 }
      );
    }

    console.log('👤 Creating session for user:', userId);
    console.log('🏭 Device:', deviceId);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    await prisma.arduinoSession.updateMany({
      where: { deviceId, isActive: true },
      data: { isActive: false },
    });

    const session = await prisma.arduinoSession.create({
      data: {
        deviceId,
        userId,
        expiresAt,
        isActive: true,
      },
    });

    console.log('✅ Session created:', session.id);
    console.log('⏰ Expires at:', expiresAt.toISOString());

    // Broadcast session started event to ALL clients (mesin_rvm display)
    console.log('🔍 DEBUG: global.io exists?', !!global.io);
    if (global.io) {
      global.io.emit('session_started', {
        type: 'session_started',
        sessionId: session.id,
        deviceId: session.deviceId,
        userId: session.userId,
        timestamp: new Date().toISOString(),
      });
      console.log('📡 Broadcasted session_started event to ALL clients');
    } else {
      console.error('❌ global.io is undefined - Socket.io not available!');
    }

    return NextResponse.json({
      success: true,
      message: 'Session created successfully',
      data: {
        sessionId: session.id,
        deviceId: session.deviceId,
        userId: session.userId,
        expiresAt: session.expiresAt,
        expiresInMinutes,
      },
    });
  } catch (error) {
    console.error('❌ Error creating session:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
