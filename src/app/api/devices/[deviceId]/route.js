import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const { deviceId } = params;

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'deviceId is required' },
        { status: 400 }
      );
    }

    const device = await prisma.arduinoConnection.findUnique({
      where: { deviceId },
      select: {
        deviceId: true,
        status: true,
        locationId: true,
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
        { success: false, error: `Device ${deviceId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        deviceId: device.deviceId,
        status: device.status,
        locationId: device.locationId,
        locationName: device.location?.name || null,
      },
    });
  } catch (error) {
    console.error('Error fetching device info:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
