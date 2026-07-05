import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma.js';
import jwt from 'jsonwebtoken';

// Helper function untuk verifikasi token
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function GET(request) {
  try {
    // Try to get userId from authentication token first
    const token = request.cookies.get('token')?.value;
    let userId = null;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        userId = decoded.userId;
      }
    }

    // Fallback to query params or use default for testing
    if (!userId) {
      const { searchParams } = new URL(request.url);
      userId = searchParams.get('userId') || 'test-user-id';
    }

    console.log('📊 Getting bottle data for user:', userId);

    // Get user's bottle count data from UserBottleCount
    let userBottleCount = await prisma.userBottleCount.findUnique({
      where: { userId },
      include: {
        user: {
          select: { nama: true, email: true },
        },
      },
    });

    // If user doesn't have UserBottleCount, create one
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
        include: {
          user: {
            select: { nama: true, email: true },
          },
        },
      });
    }

    // Get unclaimed detections (for BottleIn display)
    const unclaimedDetections = await prisma.bottleCount.findMany({
      where: {
        userBottleCountId: null,
        source: 'arduino_mqtt', // Only MQTT source (Arduino sends via MQTT only)
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    const totalUnclaimedBottles = await prisma.bottleCount.aggregate({
      where: {
        userBottleCountId: null,
        source: 'arduino_mqtt', // Only MQTT source (Arduino sends via MQTT only)
      },
      _sum: { count: true },
    });

    // Calculate today's bottle count from claimed bottles
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayClaimedBottles = await prisma.bottleCount.findMany({
      where: {
        userBottleCountId: userBottleCount.id,
        timestamp: {
          gte: today,
        },
      },
    });

    const todayBottleCount = todayClaimedBottles.reduce(
      (sum, bottle) => sum + bottle.count,
      0
    );

    return NextResponse.json({
      success: true,
      bottleData: {
        // Current user data
        bottleCount: todayBottleCount, // Today's claimed bottles
        userId: userBottleCount.userId,
        totalBottles: userBottleCount.totalBottles,
        redeemableCount: userBottleCount.redeemableCount,
        lifetimeCount: userBottleCount.lifetimeCount,
        points: userBottleCount.points,
        lifetimePoints: userBottleCount.lifetimePoints,
        userName: userBottleCount.user?.nama || '',
        lastUpdated: userBottleCount.lastUpdated,

        // Unclaimed detections (untuk BottleIn page)
        unclaimedDetections: unclaimedDetections.map((detection) => ({
          id: detection.id,
          deviceId: detection.deviceId,
          count: detection.count,
          distance: detection.distance,
          timestamp: detection.timestamp,
        })),
        totalUnclaimedBottles: totalUnclaimedBottles._sum.count || 0,
        estimatedUnclaimedPoints: (totalUnclaimedBottles._sum.count || 0) * 50,
      },
    });
  } catch (error) {
    console.error('Error fetching bottle count:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching bottle count',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST method untuk menerima data dari Arduino atau menambah manual
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received bottle count data:', body);

    // Validasi data dari Arduino
    if (!body.bottleCount || typeof body.bottleCount !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid bottleCount data',
        },
        { status: 400 }
      );
    }

    // Check authentication token
    const token = request.cookies.get('token')?.value;
    let userId = null;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        userId = decoded.userId;
      }
    }

    // Fallback untuk compatibility dengan Arduino atau testing
    if (!userId) {
      userId =
        body.userId || request.headers.get('x-user-id') || 'default-rvm-user';
    }

    const rvmLocationId = body.rvmLocationId || 1; // Default RVM location ID
    const bottleAmount = body.bottleAmount || 1; // Jumlah botol yang ditambah (default 1 per deteksi)

    // Tambahkan bottles dan auto-calculate points
    const updatedBottleData = await bottleService.addBottles(
      userId,
      bottleAmount,
      rvmLocationId,
      body.deviceId
        ? `Bottle detected by ${body.deviceId} (Total detected: ${body.bottleCount})`
        : `Manual addition of ${bottleAmount} bottles`
    );

    return NextResponse.json({
      success: true,
      message: 'Bottles and points added successfully',
      data: {
        userId: updatedBottleData.userId,
        totalBottles: updatedBottleData.totalBottles,
        redeemableCount: updatedBottleData.redeemableCount,
        lifetimeCount: updatedBottleData.lifetimeCount,
        points: updatedBottleData.points,
        lifetimePoints: updatedBottleData.lifetimePoints,
        bottlesAdded: bottleAmount,
        pointsAdded: bottleAmount * 50,
        lastDetection: body.bottleCount,
      },
    });
  } catch (error) {
    console.error('Error processing bottle count:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
