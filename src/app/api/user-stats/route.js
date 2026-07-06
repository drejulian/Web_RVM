import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

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
    // Get token from cookies
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token tidak ditemukan. Silakan login kembali.',
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token tidak valid. Silakan login kembali.',
        },
        { status: 401 }
      );
    }

    // Get or create user bottle count record
    let userStats = await prisma.userBottleCount.findUnique({
      where: { userId: decoded.userId },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
      },
    });

    // If user doesn't have bottle count record, create one
    if (!userStats) {
      userStats = await prisma.userBottleCount.create({
        data: {
          userId: decoded.userId,
          totalBottles: 0,
          redeemableCount: 0,
          lifetimeCount: 0,
          points: 0,
          lifetimePoints: 0,
        },
        include: {
          user: {
            select: {
              id: true,
              nama: true,
              email: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: userStats.userId,
        userName: userStats.user.nama,
        totalBottles: userStats.totalBottles,
        redeemableCount: userStats.redeemableCount,
        lifetimeCount: userStats.lifetimeCount,
        points: userStats.points,
        lifetimePoints: userStats.lifetimePoints,
        lastUpdated: userStats.lastUpdated,
      },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);

    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST method untuk update points dan bottles (dari Arduino atau manual)
export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token tidak ditemukan. Silakan login kembali.',
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token tidak valid. Silakan login kembali.',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bottleCount = 0, pointsToAdd = 0, action = 'add' } = body;

    // Get or create user bottle count record
    let userStats = await prisma.userBottleCount.findUnique({
      where: { userId: decoded.userId },
    });

    if (!userStats) {
      userStats = await prisma.userBottleCount.create({
        data: {
          userId: decoded.userId,
          totalBottles: 0,
          redeemableCount: 0,
          lifetimeCount: 0,
          points: 0,
          lifetimePoints: 0,
        },
      });
    }

    // Calculate new values based on action
    let newTotalBottles = userStats.totalBottles;
    let newRedeemableCount = userStats.redeemableCount;
    let newLifetimeCount = userStats.lifetimeCount;
    let newPoints = userStats.points;
    let newLifetimePoints = userStats.lifetimePoints;

    if (action === 'add') {
      // Add bottles and points
      newTotalBottles += bottleCount;
      newRedeemableCount += bottleCount;
      newLifetimeCount += bottleCount;
      newPoints += pointsToAdd;
      newLifetimePoints += pointsToAdd;

      // Auto-calculate points from bottles if pointsToAdd is 0
      if (pointsToAdd === 0 && bottleCount > 0) {
        const autoPoints = bottleCount * 50; // 1 bottle = 50 points
        newPoints += autoPoints;
        newLifetimePoints += autoPoints;
      }
    } else if (action === 'redeem') {
      // Redeem bottles (reduce redeemable count)
      if (userStats.redeemableCount >= bottleCount) {
        newRedeemableCount -= bottleCount;
      } else {
        return NextResponse.json(
          {
            success: false,
            message: 'Jumlah botol yang dapat ditukar tidak mencukupi',
          },
          { status: 400 }
        );
      }
    }

    // Update the database
    const updatedStats = await prisma.userBottleCount.update({
      where: { userId: decoded.userId },
      data: {
        totalBottles: newTotalBottles,
        redeemableCount: newRedeemableCount,
        lifetimeCount: newLifetimeCount,
        points: newPoints,
        lifetimePoints: newLifetimePoints,
      },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
      },
    });

    // Create transaction record
    if (bottleCount > 0) {
      await prisma.bottleTransaction.create({
        data: {
          userId: decoded.userId,
          type: action === 'add' ? 'DEPOSIT' : 'REDEEM',
          amount: bottleCount,
          description:
            action === 'add'
              ? `Tambah ${bottleCount} botol via RVM`
              : `Tukar ${bottleCount} botol`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message:
        action === 'add'
          ? 'Botol dan poin berhasil ditambahkan'
          : 'Botol berhasil ditukar',
      data: {
        userId: updatedStats.userId,
        userName: updatedStats.user.nama,
        totalBottles: updatedStats.totalBottles,
        redeemableCount: updatedStats.redeemableCount,
        lifetimeCount: updatedStats.lifetimeCount,
        points: updatedStats.points,
        lifetimePoints: updatedStats.lifetimePoints,
        lastUpdated: updatedStats.lastUpdated,
      },
    });
  } catch (error) {
    console.error('Error updating user stats:', error);

    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
