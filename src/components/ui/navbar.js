'use client';
import { usePathname } from 'next/navigation';
import { IoHomeOutline } from 'react-icons/io5';
import { CiLocationOn, CiUser } from 'react-icons/ci';
import { FiActivity } from 'react-icons/fi';
import { BiNavigation } from 'react-icons/bi';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useLocation } from '../../contexts/LocationContext';

export default function Navbar() {
  const pathname = usePathname();
  const { selectedLocation, currentLocation, permitLocationAccess } =
    useLocation();

  const isActive = (path) => pathname === path;

  const openGoogleMaps = () => {
    if (selectedLocation && currentLocation) {
      const { lat, lng } = selectedLocation;
      window.open(
        `https://www.google.com/maps/dir/${currentLocation[0]},${currentLocation[1]}/${lat},${lng}`,
        '_blank'
      );
    } else {
      console.error('No Location Selected or Current Location not available');
    }
  };

  return (
    <div className="bg-white border rounded-t-3xl mx-2 fixed -bottom-1 inset-x-0 shadow-navbar-shadow">
      <ul className="flex gap-4 justify-center items-center p-2 h-[85px]">
        <Link href="/home">
          <li
            className={`flex flex-col items-center ${
              isActive('/home') ? 'text-primary' : 'text-black'
            }`}
          >
            <div>
              <IoHomeOutline className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium">Beranda</span>
          </li>
        </Link>

        <Link href="/lokasi" data-tour="location">
          <li
            className={`flex flex-col items-center ${
              isActive('/lokasi') ? 'text-primary' : 'text-black'
            }`}
          >
            <div className="flex justify-center">
              <CiLocationOn className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium">Lokasi</span>
          </li>
        </Link>

        {pathname === '/lokasi' ? (
          <li
            onClick={
              selectedLocation && permitLocationAccess ? openGoogleMaps : null
            }
            className={`flex flex-col items-center -translate-y-9 ${
              selectedLocation && permitLocationAccess
                ? 'cursor-pointer'
                : ' cursor-not-allowed'
            }`}
          >
            {permitLocationAccess ? (
              <>
                <div className="relative inline-flex">
                  {selectedLocation && (
                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary"></div>
                  )}
                  <div className="relative rounded-full p-6 bg-primary mb-2">
                    <Image
                      src="/svg/nav.svg"
                      alt="navigasi putih"
                      width={40}
                      height={40}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-black">Navigasi</span>
              </>
            ) : (
              <>
                <div className="rounded-full p-6 bg-gray-300 mb-2">
                  <Image
                    src="/svg/nav_hitam.svg"
                    alt="navigasi hitam"
                    width={40}
                    height={40}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500">
                  Navigasi
                </span>
              </>
            )}
          </li>
        ) : (
          <Link href="/qr" data-tour="scan">
            <li className="flex flex-col items-center -translate-y-9 ">
              <div className="rounded-full p-6 bg-primary mb-2 ">
                <Image
                  src="/svg/icon-scan.svg"
                  alt="icon scan"
                  width={42}
                  height={42}
                />
              </div>
              <span className="text-xs font-medium text-black">QR Scanner</span>
            </li>
          </Link>
        )}

        <Link href="/aktifitas" data-tour="activities">
          <li
            className={`flex flex-col items-center ${
              isActive('/aktifitas') ? 'text-primary' : 'text-black'
            }`}
          >
            <div className="pb-1">
              <FiActivity className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium">Aktifitas</span>
          </li>
        </Link>

        <Link href="/profil" data-tour="profile">
          <li
            className={`flex flex-col items-center ${
              isActive('/profil') ? 'text-primary' : 'text-black'
            }`}
          >
            <div>
              <CiUser className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium">Profil</span>
          </li>
        </Link>
      </ul>
    </div>
  );
}
