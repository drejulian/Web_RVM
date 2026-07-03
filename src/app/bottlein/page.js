'use client';
import Modal from '@/components/ui/modal';
import Image from 'next/image';
import Link from 'next/link';
import { useFetch } from '@/hooks/use-fetch';
import { useSocket } from '@/hooks/use-socket-clients';
import { useEffect, useState } from 'react';

export default function RedeemGopayPage() {
  const [data, loading, error] = useFetch('/api/bottle-count');
  const [claiming, setClaiming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [realtimeData, setRealtimeData] = useState(null);
  const [newDetectionAlert, setNewDetectionAlert] = useState(false);

  // Socket.IO connection for real-time updates
  const {
    isConnected,
    lastMessage,
    error: socketError,
  } = useSocket(null, {
    onConnect: (socket) => {
      console.log('✅ Socket.IO connected for real-time updates');
    },

    onDisconnect: (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
    },

    onMessage: (message) => {
      console.log('📡 Socket.IO message received:', message);

      if (message.type === 'bottle_detected') {
        setRealtimeData(message.data);

        // Show new detection alert with animation
        setNewDetectionAlert(true);
        setTimeout(() => setNewDetectionAlert(false), 3000);

        // Play notification sound
        playNotificationSound();

        // Optional: Refresh API data untuk sinkronisasi
        // Data real-time sudah cukup untuk bottle count
      }
    },

    onError: (error) => {
      console.error('❌ Socket.IO error:', error);
    },
  });

  // Play notification sound
  const playNotificationSound = () => {
    try {
      // Create audio context for better browser support
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const audioContext = new AudioContext();

        // Create a simple beep sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }
    } catch (e) {
      console.log('Audio notification not available:', e);
    }
  };

  // Auto-create session when page loads
  useEffect(() => {
    const createSession = async () => {
      try {
        const response = await fetch('/api/sessions/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: 'RVM-LAB-001',
            expiresInMinutes: 5
          })
        });
        
        const result = await response.json();
        if (result.success) {
          console.log('✅ Session created:', result.data.sessionId);
        } else {
          console.error('❌ Failed to create session:', result.error);
        }
      } catch (error) {
        console.error('❌ Error creating session:', error);
      }
    };
    
    createSession();
    
    return () => {
      const endSession = async () => {
        try {
          console.log('🔒 Ending session on page unmount...');
          await fetch('/api/sessions/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: 'RVM-LAB-001' })
          });
          console.log('✅ Session ended');
        } catch (error) {
          console.error('❌ Error ending session:', error);
        }
      };
      endSession();
    };
  }, []);

  // Extract data with safe defaults - Updated for new 2-stage flow
  const bottleData = data?.bottleData || {};
  const bottleCount =
    realtimeData?.totalUnclaimedBottles ||
    bottleData.totalUnclaimedBottles ||
    0;
  const unclaimedDetections = bottleData.unclaimedDetections || [];
  const estimatedPoints = bottleCount * 50; // Update with real-time data

  const userStats = {
    userName: bottleData.userName || '',
    points: bottleData.points || 0,
    totalBottles: bottleData.totalBottles || 0,
    lifetimePoints: bottleData.lifetimePoints || 0,
  };

  console.log('Bottle data:', data);
  console.log('Real-time data:', realtimeData);
  console.log('Socket connected:', isConnected);
  console.log('Bottle count:', bottleCount);
  console.log('User stats:', userStats);

  const handleClaimBottles = () => {
    if (bottleCount === 0) return;
    setShowConfirmModal(true);
  };

  const handleConfirmClaim = async () => {
    setShowConfirmModal(false);
    setClaiming(true);
    try {
      const response = await fetch('/api/bottle-count/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          detectionIds: unclaimedDetections.slice(0, 20).map((d) => d.id), // Limit 20 per batch
          claimAll: unclaimedDetections.length <= 20,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to receipt page dengan data hasil claim
        const claimedBottles =
          result.data?.bottlesAdded || result.data?.claimedCount || bottleCount;
        const pointsEarned = result.data?.pointsEarned || claimedBottles * 50;

        // Simpan data claim ke sessionStorage untuk ditampilkan di receipt
        sessionStorage.setItem(
          'claimResult',
          JSON.stringify({
            bottlesAdded: claimedBottles,
            pointsEarned: pointsEarned,
            claimTime: new Date().toISOString(),
          })
        );

        // Redirect ke receipt page
        window.location.href = '/receipt-qr';
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error claiming bottles:', error);
      alert('Terjadi kesalahan saat mengklaim botol');
    } finally {
      setClaiming(false);
    }
  };

  const handleCancelClaim = () => {
    setShowConfirmModal(false);
  };

  return (
    <div className="bg-primary h-screen pt-[35px] min-h-screen flex flex-col">
      {/* Header */}
      <h1 className="text-center font-semibold mt-5 text-white text-3xl">
        Masukkan Botol
      </h1>
      <p className="text-center font-regular mt-5 text-white text-xs mb-8">
        Silahkan masukkan botol kedalam mesin
      </p>

      {/* Content Section */}
      <div className="bg-bgSecondary rounded-t-[36px] p-5 flex-1">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="grid justify-center mt-10">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-text-primary mb-2">
              Halo{userStats.userName ? `, ${userStats.userName}` : ''}!
            </h1>
            <p className="text-sm text-gray-600">Selamat datang di sesi RVM</p>
          </div>

          <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
            <h2 className="text-center text-lg font-semibold text-text-primary mb-4">
              Botol Terkumpul Sesi Ini
            </h2>
            <div className="flex justify-between items-center gap-7">
              <Image
                src="/svg/bottle.svg"
                alt="bottle"
                width={100}
                height={190}
              />
              <div className="text-center">
                <h1
                  className={`text-7xl font-bold transition-all duration-500 ${
                    newDetectionAlert
                      ? 'text-green-600 scale-110 animate-pulse'
                      : 'text-primary'
                  }`}
                >
                  {loading ? '...' : bottleCount}
                </h1>
                <p className="text-sm text-gray-600 mt-2">Botol</p>
              </div>
            </div>

            <div className="flex justify-center mt-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p
                  className={`text-2xl font-bold transition-all duration-500 ${
                    newDetectionAlert
                      ? 'text-green-600 scale-110'
                      : 'text-blue-600'
                  }`}
                >
                  {loading ? '...' : `+${estimatedPoints}`}
                </p>
                <p className="text-xs text-gray-600">Estimasi Poin</p>
              </div>
            </div>

            {/* Pulse animation overlay when detecting */}
            {newDetectionAlert && (
              <div className="absolute inset-0 bg-green-100 opacity-20 animate-ping rounded-2xl"></div>
            )}
          </div>
        </div>

        {/* Claim Bottles */}
        <div className="flex justify-center">
          <button
            className={`py-3 px-9 rounded-xl text-white font-semibold text-xl disabled:opacity-50 transition-all duration-300 ${
              bottleCount > 0
                ? 'bg-primary hover:bg-primary-dark hover:scale-105'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={loading || claiming || bottleCount === 0}
            onClick={handleClaimBottles}
          >
            {claiming
              ? '⏳ Memproses Klaim...'
              : loading
                ? '⏳ Loading...'
                : bottleCount > 0
                  ? `Klaim ${bottleCount} Botol`
                  : 'Belum Ada Deteksi'}
          </button>
        </div>

        {claiming && (
          <div className="text-center mt-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              <p className="text-sm text-gray-600">
                Sedang memproses {bottleCount} botol, mohon tunggu...
              </p>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Klaim */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full animate-scale-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Konfirmasi Klaim
                </h3>
                <p className="text-gray-600 text-sm">
                  Anda akan mengklaim <strong>{bottleCount} botol</strong> dan
                  mendapatkan{' '}
                  <strong className="text-green-600">
                    {bottleCount * 50} poin
                  </strong>
                  .
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Setelah diklaim, Anda tidak bisa menambah botol lagi di sesi
                  ini.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleConfirmClaim}
                  className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
                  disabled={claiming}
                >
                  ✅ Ya, Klaim Sekarang
                </button>

                <button
                  onClick={handleCancelClaim}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  disabled={claiming}
                >
                  ❌ Batal, Tambah Botol Lagi
                </button>
              </div>

              <p className="text-center text-gray-400 text-xs mt-3">
                Pilih "Batal" jika ingin memasukkan lebih banyak botol
              </p>
            </div>
          </div>
        )}

        <Modal />
      </div>
    </div>
  );
}
