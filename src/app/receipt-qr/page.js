'use client';
import Link from 'next/link';
import ReceiptRedeemQrPage from '@/components/containers/receipt-reedem-qr';
import { useEffect, useState } from 'react';
import { useFetch } from '@/hooks/use-fetch';

export default function Page() {
  const [data, loading, error] = useFetch('/api/bottle-count');
  const [accessTime, setAccessTime] = useState('');
  const [claimResult, setClaimResult] = useState(null);
  const [deviceContext, setDeviceContext] = useState(null);

  // Check for claim result from sessionStorage
  useEffect(() => {
    const storedClaimResult = sessionStorage.getItem('claimResult');
    if (storedClaimResult) {
      setClaimResult(JSON.parse(storedClaimResult));
      // Clear after use
      sessionStorage.removeItem('claimResult');
    }

    const storedDeviceContext = sessionStorage.getItem('deviceContext');
    if (storedDeviceContext) {
      setDeviceContext(JSON.parse(storedDeviceContext));
    }
  }, []);

  // Extract bottle data from API response or claim result
  const bottleData = data?.bottleData || {};
  const {
    bottleCount = 0,
    totalBottles = 0,
    points = 0,
    lifetimePoints = 0,
    redeemableCount = claimResult?.bottlesAdded || 0,
    userId = null,
  } = bottleData;

  // Use claim result data if available
  const sessionBottles = claimResult?.bottlesAdded || redeemableCount;
  const sessionPoints = claimResult?.pointsEarned || redeemableCount * 50;
  const locationName =
    claimResult?.locationName ||
    deviceContext?.locationName ||
    'Lokasi RVM tidak tersedia';

  // Fetch user details from profile API
  const [userData, userLoading, userError] = useFetch('/api/user/profile');

  useEffect(() => {
    // Use claim time if available, otherwise current time
    const timeToFormat = claimResult?.claimTime
      ? new Date(claimResult.claimTime)
      : new Date();
    const formattedTime = timeToFormat.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    setAccessTime(formattedTime);
  }, [claimResult]);

  console.log('Receipt data:', data);
  console.log('User data:', userData);
  console.log('User error:', userError);

  // Get the actual user name with proper fallback
  const getUserName = () => {
    if (userLoading) return 'Loading...';
    if (userError) return 'Error memuat nama';
    if (userData?.user?.nama) return userData.user.nama;
    if (userData?.nama) return userData.nama;
    return 'Nama tidak tersedia';
  };

  return (
    <ReceiptRedeemQrPage title="Sesi Selesai">
      {/* Error Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {userError && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">User Data Warning: </strong>
          <span className="block sm:inline">
            Tidak dapat memuat data pengguna
          </span>
        </div>
      )}

      <h2 className="text-[18px] font-semibold mt-6 mb-2 text-center text-text-primary">
        {claimResult ? 'Klaim Botol Berhasil!' : 'Anda Meninggalkan RVM Lokasi'}
      </h2>
      <p className="text-sm text-regular text-gray-600 mb-6 text-center">
        {claimResult ? 'Hasil Klaim Anda' : 'Hasil Sesi Anda'}
      </p>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 text-left text-sm mb-4">
        <div className="border shadow-sm p-3 rounded-lg">
          <p className="font-regular text-gray-500 text-sm">Botol Sesi Ini</p>
          <p className="font-semibold text-[#121212] text-[24px] pt-3">
            {loading ? 'Loading...' : sessionBottles}
          </p>
        </div>
        <div className="border shadow-sm p-3 rounded-lg">
          <p className="font-regular text-gray-500 text-sm">Poin Earned</p>
          <p className="font-semibold text-[#121212] text-[24px] pt-3">
            {loading ? 'Loading...' : `+${sessionPoints}`}
          </p>
        </div>
        <div className="border shadow-sm p-3 rounded-lg">
          <p className="font-regular text-gray-500 text-sm">Total Poin</p>
          <p className="font-semibold text-[#121212] text-sm">
            {loading ? 'Loading...' : points.toLocaleString()}
          </p>
        </div>
        <div className="border shadow-sm p-3 rounded-lg">
          <p className="font-semibold text-gray-500">Waktu</p>
          <p className="font-semibold text-[#121212] text-sm">
            {accessTime || 'Loading...'}
          </p>
        </div>
      </div>

      {/* Full width cards */}
      <div className="space-y-4">
        <div className="border shadow-sm p-3 rounded-lg">
          <p className="font-regular text-gray-500 text-sm">Lokasi</p>
          <p className="font-semibold text-[#121212] text-sm">{locationName}</p>
        </div>

        <div className="border shadow-sm p-3 rounded-lg">
          <p className="font-semibold text-gray-500 text-sm">Nama Pengguna</p>
          <p className="font-semibold text-[#121212] text-sm">
            {getUserName()}
          </p>
        </div>

        <div className="border shadow-sm p-3 rounded-lg">
          <p className="font-semibold text-gray-500 text-sm">User ID</p>
          <p className="font-semibold text-[#121212] text-xs break-all">
            {loading ? 'Loading...' : userId || 'N/A'}
          </p>
        </div>
      </div>
    </ReceiptRedeemQrPage>
  );
}
