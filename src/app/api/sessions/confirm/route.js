import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function POST(request) {
  try {
    console.log('🔔 Confirm endpoint called');
    
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.ARDUINO_API_KEY) {
      console.error('❌ Unauthorized: Invalid API Key during confirmation');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let body;
    try {
      const text = await request.text();
      console.log('📥 Raw body received:', text);
      
      if (!text || text.trim() === '') {
        throw new Error('Empty request body');
      }
      
      body = JSON.parse(text);
      console.log('📦 Parsed body:', body);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body', details: parseError.message },
        { status: 400 }
      );
    }

    const { deviceId, sessionId } = body;

    if (!deviceId || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'deviceId and sessionId are required' },
        { status: 400 }
      );
    }

    console.log('🤝 Arduino confirming connection...');
    console.log('🏭 Device:', deviceId);
    console.log('🆔 Session:', sessionId);

    const session = await prisma.arduinoSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.deviceId !== deviceId) {
      return NextResponse.json(
        { success: false, error: 'Device ID mismatch' },
        { status: 400 }
      );
    }

    if (!session.isActive) {
      return NextResponse.json(
        { success: false, error: 'Session is not active' },
        { status: 400 }
      );
    }

    await prisma.arduinoSession.update({
      where: { id: sessionId },
      data: { 
        confirmedAt: new Date(),
      },
    });

    console.log('✅ Arduino connection confirmed!');
    console.log('👤 User can now use the machine');

    if (global.io) {
      global.io.to('bottle-detection').emit('session_started', {
        deviceId,
        sessionId,
        userId: session.userId,
        timestamp: new Date().toISOString(),
      });
      console.log('📡 Broadcasted session_started event via Socket.IO');
    }

    return NextResponse.json({
      success: true,
      message: 'Connection confirmed',
      data: {
        sessionId: session.id,
        userId: session.userId,
        deviceId: session.deviceId,
      },
    });
  } catch (error) {
    console.error('❌ Error confirming connection:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
