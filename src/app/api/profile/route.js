import prisma from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// Helper function untuk verifikasi token
function verifyToken(token) {
  if (!token) {
    return null;
  }

  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET tidak dikonfigurasi di environment variables');
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.warn('⚠️ Token verification failed:', error.message);
    return null;
  }
}

export async function GET(req) {
  try {
    console.log('📍 Profile API GET called');
    const token = req.cookies.get('token')?.value;

    if (!token) {
      console.log('⚠️ No token found in cookies');
      return NextResponse.json(
        {
          success: false,
          message: 'Token tidak ditemukan. Silakan login kembali.',
        },
        { status: 401 }
      );
    }

    console.log('🔐 Token found, verifying...');
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('⚠️ Token verification failed');
      return NextResponse.json(
        {
          success: false,
          message: 'Token tidak valid. Silakan login kembali.',
        },
        { status: 401 }
      );
    }

    console.log('📧 Token verified for user:', decoded.userId);

    // Ambil data user dari database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        bottleCount: true, // Include bottle count data
      },
    });

    if (!user) {
      console.log('⚠️ User not found:', decoded.userId);
      return NextResponse.json(
        {
          success: false,
          message: 'User tidak ditemukan',
        },
        { status: 404 }
      );
    }

    console.log('✅ User found:', user.email);

    let bottleCount = user.bottleCount;
    if (!bottleCount) {
      console.log('📝 Creating UserBottleCount for user:', user.id);
      bottleCount = await prisma.userBottleCount.create({
        data: {
          userId: user.id,
          totalBottles: 0,
          redeemableCount: 0,
          lifetimeCount: 0,
          points: 0,
          lifetimePoints: 0,
        },
      });
    }

    // Hapus password dari response untuk keamanan
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        code: 200,
        message: 'Berhasil mengambil data profile',
        data: {
          id: userWithoutPassword.id,
          email: userWithoutPassword.email,
          nama: userWithoutPassword.nama,
          phoneNumber: userWithoutPassword.phoneNumber,
          password: !!password,
          createdAt: userWithoutPassword.createdAt,
          updatedAt: userWithoutPassword.updatedAt,
          bottleCount: bottleCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Profile GET Error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    // Ambil token dari cookies
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token tidak ditemukan. Silakan login kembali.',
        },
        { status: 401 }
      );
    }

    // Verifikasi token
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

    const { nama, phoneNumber } = await req.json();

    // Validasi input
    if (!nama || !phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nama dan nomor telepon wajib diisi',
        },
        { status: 400 }
      );
    }

    // Update data user
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        nama,
        phoneNumber,
        updatedAt: new Date(),
      },
      include: {
        bottleCount: true,
      },
    });

    // Hapus password dari response
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(
      {
        success: true,
        code: 200,
        message: 'Profile berhasil diupdate',
        data: {
          id: userWithoutPassword.id,
          email: userWithoutPassword.email,
          nama: userWithoutPassword.nama,
          phoneNumber: userWithoutPassword.phoneNumber,
          createdAt: userWithoutPassword.createdAt,
          updatedAt: userWithoutPassword.updatedAt,
          bottleCount: userWithoutPassword.bottleCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Update Profile Error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
