'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFetch } from '@/hooks/use-fetch';
import { fetchTransactionHistory, claimPoints } from '@/services/user-service';

export default function AktifitasPage() {
  const [userStatsData, statsLoading] = useFetch('/api/user-stats');
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingId, setClaimingId] = useState(null);

  const userStats = userStatsData || {
    totalBottles: 0,
    points: 0,
    lifetimePoints: 0,
    lifetimeCount: 0,
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchTransactionHistory(1, 20);

      if (response.success) {
        setActivities(response.data);
      } else {
        setError(response.error || 'Failed to load activities');
      }
    } catch (err) {
      console.error('Error loading activities:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimPoints = async (bottleCountId) => {
    try {
      setClaimingId(bottleCountId);
      const response = await claimPoints([bottleCountId]);

      if (response.success) {
        await loadActivities();
        setClaimingId(null);
      } else {
        setError(response.error || 'Failed to claim points');
        setClaimingId(null);
      }
    } catch (err) {
      console.error('Error claiming points:', err);
      setError(err.message || 'An error occurred while claiming points');
      setClaimingId(null);
    }
  };

  const getActivityIcon = (activity) => {
    if (
      activity.type === 'PENDING_CLAIM' ||
      (activity.type === 'REDEEM' && !activity.isClaimed)
    ) {
      return '/svg/Income.svg';
    }
    if (activity.type === 'DEPOSIT') {
      return '/svg/bottle.svg';
    }
    if (activity.type === 'REDEEM') {
      return '/svg/Income.svg';
    }
    return '/svg/bottle.svg';
  };

  const getActivityLabel = (activity) => {
    if (activity.type === 'PENDING_CLAIM') {
      return 'Ambil Poin';
    }
    return activity.label;
  };

  const getButtonStatus = (activity) => {
    if (activity.type === 'PENDING_CLAIM') {
      return 'pending';
    }
    if (activity.isClaimed) {
      return 'completed';
    }
    return 'pending';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateStr = date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return { time, dateStr };
  };

  const totalPoints = userStats.points ?? 0;
  const lifetimeBottles = userStats.lifetimeCount ?? 0;
  const totalWithdrawn = userStats.lifetimePoints ?? 0;

  return (
    <div className="bg-primary h-screen pt-[35px] flex flex-col">
      {/* Header */}
      <div className="justify-center mx-6">
        <h1 className="text-bgSecondary font-semibold w-full text-center text-[24px] pb-6 pt-1">
          Aktifitas
        </h1>

        {statsLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid gap-0 justify-center text-center shadow-lg rounded-2xl bg-white h-16 p-1">
              <span className="font-medium text-text-primary">Total Poin</span>
              <span className="font-bold text-primary text-2xl">
                {totalPoints}
              </span>
            </div>

            <div className="flex justify-between gap-2">
              {/* Total Tarik Saldo */}
              <div className="grid gap-0 justify-center text-center shadow-lg rounded-2xl bg-primary w-[160px] h-16 p-1">
                <div className="flex justify-between px-1">
                  <Image
                    src="/svg/Income.svg"
                    alt="income"
                    width={12}
                    height={12}
                  />
                  <span className="font-regular text-white text-xs pl-2 my-1">
                    Total Tarik Saldo
                  </span>
                </div>
                <span className="font-bold text-white text-2xl">
                  Rp. {(totalWithdrawn * 1000).toLocaleString('id-ID')}
                </span>
              </div>
              {/* Total Botol */}
              <div className="grid gap-0 justify-center text-center shadow-lg rounded-2xl bg-primary w-[160px] h-16 p-1">
                <div className="flex justify-between px-1">
                  <Image
                    src="/svg/Expense.svg"
                    alt="expense"
                    width={12}
                    height={12}
                  />
                  <span className="font-regular text-white text-xs pl-2 my-1">
                    Total Botol
                  </span>
                </div>
                <span className="font-bold text-white text-2xl">
                  {lifetimeBottles} pcs
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activities Section */}
      <div className="bg-bgSecondary rounded-t-[36px] pt-10 px-9 pb-8 mt-3 relative overflow-y-auto flex-1">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Belum ada aktivitas</p>
          </div>
        ) : (
          <div className="">
            <div className="flex justify-between items-center mb-5">
              <span className="font-semibold text-sm text-start text-text-primary">
                Riwayat{' '}
                {new Date().toLocaleDateString('id-ID', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <Link href="#" className="flex justify-end gap-1">
                <Image
                  src="/svg/calendar.svg"
                  alt="icon calendar"
                  width={15.75}
                  height={15.75}
                />
                <p className="text-primary hover:underline text-sm">
                  Lihat Semua
                </p>
              </Link>
            </div>

            {/* Activity List */}
            <div className="space-y-6">
              {activities.map((activity) => {
                const { time, dateStr } = formatDate(activity.timestamp);
                const buttonStatus = getButtonStatus(activity);

                return (
                  <div
                    key={activity.id}
                    className="flex justify-start space-x-4"
                  >
                    <div className="bg-secondary w-14 h-[53px] rounded-2xl flex items-center justify-center">
                      <Image
                        src={getActivityIcon(activity)}
                        alt={activity.label}
                        width={24}
                        height={24}
                      />
                    </div>
                    <div className="grid gap-0 flex-1">
                      <h1 className="font-medium text-sm text-text-primary">
                        {getActivityLabel(activity)}
                      </h1>
                      <p className="font-semibold text-gray-500 text-xs">
                        {time} -{' '}
                        {new Date(activity.timestamp).toLocaleDateString(
                          'id-ID',
                          { month: 'short', day: 'numeric' }
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center py-2 px-3 min-w-[50px]">
                      <p className="text-lg font-semibold text-gray-900">
                        {activity.type === 'DEPOSIT' ||
                        activity.type === 'PENDING_CLAIM'
                          ? activity.amount || 0
                          : activity.type === 'REDEEM'
                            ? activity.points || 0
                            : activity.amount || 0}
                      </p>
                    </div>
                    <div>
                      {activity.type === 'PENDING_CLAIM' ? (
                        <button
                          onClick={() =>
                            handleClaimPoints(activity.bottleCountId)
                          }
                          disabled={claimingId === activity.bottleCountId}
                          className="bg-primary text-white rounded-xl text-nowrap px-3 py-1 my-2 text-xs font-medium hover:bg-primary-dark disabled:opacity-50"
                        >
                          {claimingId === activity.bottleCountId
                            ? 'Loading...'
                            : 'Ambil Poin'}
                        </button>
                      ) : (
                        <button className="text-nowrap px-5 my-2 text-gray-500 text-xs font-medium">
                          Selesai
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
