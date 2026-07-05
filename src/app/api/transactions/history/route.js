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

// GET /api/transactions/history - Get user's transaction history
export async function GET(request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;
    const page = parseInt(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    console.log('📊 Getting transaction history for user:', userId);

    // Get user's bottle count to find their ID
    const userBottleCount = await prisma.userBottleCount.findUnique({
      where: { userId },
    });

    if (!userBottleCount) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      });
    }

    // Get all bottle transactions for this user
    const transactions = await prisma.bottleTransaction.findMany({
      where: {
        userBottleCountId: userBottleCount.id,
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalTransactions = await prisma.bottleTransaction.count({
      where: {
        userBottleCountId: userBottleCount.id,
      },
    });

    // Also get unclaimed bottle counts (deposit yang belum claim poin)
    const unclaimedBottles = await prisma.bottleCount.findMany({
      where: {
        userBottleCountId: null,
        source: 'arduino_mqtt', // Only MQTT source (Arduino sends via MQTT only)
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Format transactions dengan icon dan status
    const formattedTransactions = transactions.map((tx) => {
      let icon = '/svg/bottle.svg';
      let label = 'Transaksi';
      let status = 'Selesai';

      if (tx.transactionType === 'DEPOSIT') {
        icon = '/svg/bottle.svg';
        label = 'Botol Masuk';
      } else if (tx.transactionType === 'REDEEM') {
        icon = '/svg/Income.svg';
        label = 'Ambil Poin';
      } else if (tx.transactionType === 'ADJUSTMENT') {
        icon = '/svg/Expense.svg';
        label = 'Penyesuaian';
      }

      return {
        id: tx.id,
        type: tx.transactionType,
        label,
        icon,
        amount: tx.bottleCount,
        points: tx.pointsEarned,
        timestamp: tx.timestamp,
        status,
        isClaimed: true,
      };
    });

    // Add unclaimed deposits as pending claim points
    const pendingClaims = unclaimedBottles.map((bottle) => ({
      id: `unclaimed-${bottle.id}`,
      type: 'PENDING_CLAIM',
      label: 'Ambil Poin',
      icon: '/svg/Income.svg',
      amount: bottle.count,
      points: bottle.count * 50,
      timestamp: bottle.timestamp,
      status: 'Pending',
      isClaimed: false,
      bottleCountId: bottle.id,
    }));

    // Combine and sort
    const allActivities = [...formattedTransactions, ...pendingClaims].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    return NextResponse.json({
      success: true,
      data: allActivities.slice(0, limit),
      pagination: {
        total: totalTransactions + unclaimedBottles.length,
        page,
        limit,
        totalPages: Math.ceil(
          (totalTransactions + unclaimedBottles.length) / limit
        ),
      },
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
