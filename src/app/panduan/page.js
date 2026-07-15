'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';

export default function Page() {
  const videoRef = useRef(null); // Referensi untuk elemen video
  const [isPlaying, setIsPlaying] = useState(false); // Status play/pause
  const [showControls, setShowControls] = useState(true); // Status visibilitas tombol

  // Fungsi untuk mengatur play/pause
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause(); // Pause video
      } else {
        videoRef.current.play(); // Play video
      }
      setIsPlaying(!isPlaying); // Toggle status play/pause
    }
  };

  // Fungsi untuk reset timer dan menampilkan kontrol
  const resetTimer = () => {
    setShowControls(true); // Tampilkan kontrol
    clearTimeout(hideControlsTimeout); // Hapus timer sebelumnya
    hideControlsTimeout = setTimeout(() => setShowControls(false), 3000); // Timer 3000ms untuk menyembunyikan kontrol
  };

  // Timer untuk menyembunyikan kontrol
  let hideControlsTimeout = null;

  // Efek untuk mengatur event listener pada interaksi
  useEffect(() => {
    const handleUserInteraction = () => resetTimer();
    // Menambahkan event listener untuk video
    if (videoRef.current) {
      videoRef.current.addEventListener('play', handleUserInteraction);
      videoRef.current.addEventListener('pause', handleUserInteraction);
      videoRef.current.addEventListener('mousemove', handleUserInteraction);
    }

    // Membersihkan event listener saat komponen di-unmount
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', handleUserInteraction);
        videoRef.current.removeEventListener('pause', handleUserInteraction);
        videoRef.current.removeEventListener(
          'mousemove',
          handleUserInteraction
        );
      }
      clearTimeout(hideControlsTimeout); // Hapus timer
    };
  }, []);

  return (
    <div className="bg-primary h-full pt-[35px] flex flex-col">
      <div className="flex items-center justify-center">
        <Link href="qr" className="absolute left-6 top-[44px]">
          <Image src="/svg/image-back.svg" alt="Back" width={14} height={25} />
        </Link>

        <h1 className="text-bgSecondary font-semibold w-full text-center text-[20px] pb-6 pt-1">
          Panduan
        </h1>
      </div>
      <p className="text-white font-semibold text-sm text-center px-[60px] pb-5">
        Penukaran sampah botol plastik di Reverse Vending Machine
      </p>

      <div className="bg-bgSecondary rounded-t-[36px] mt-7 pt-10 px-9 pb-8 flex-1">
        <div className="flex justify-center -translate-y-14 items-center relative rounded-xl">
          <div className=" bg-white shadow-xl relative rounded-xl">
            <video
              ref={videoRef}
              src="/video/animasi-tutor.mp4" // Ganti dengan path video Anda
              className="w-full h-full rounded-xl"
              onMouseMove={resetTimer} // Deteksi gerakan mouse
            />
            {showControls && (
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md"
              >
                <Image
                  src={isPlaying ? '/svg/pause.svg' : '/svg/play.svg'} // Ganti dengan ikon play/pause
                  alt={isPlaying ? 'Pause' : 'Play'}
                  width={50}
                  height={50}
                  className="cursor-pointer"
                />
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-11 gap-y-8">
          <div className="">
            <Image
              src="/svg/P-1.svg"
              alt="panduan-1"
              width={138.44}
              height={122.73}
            />
            <div className=" w-[138.44px]">
              <p className="text-xs font-semibold text-wrap text-center pt-2 text-text-primary">
                Temukan mesin Reverse Vending Machine (RVM) terdekat.
              </p>
            </div>
          </div>
          <div>
            <Image
              src="/svg/P-2.svg"
              alt="panduan-2"
              width={138.44}
              height={122.73}
            />
            <div className=" w-[138.44px]">
              <p className="text-xs font-semibold text-wrap text-center pt-2 text-text-primary">
                Scan QR Code yang tersedia pada mesin RVM menggunakan aplikasi.
              </p>
            </div>
          </div>
          <div>
            <Image
              src="/svg/P-3.svg"
              alt="panduan-3"
              width={138.44}
              height={122.73}
            />
            <div className=" w-[138.44px]">
              <p className="text-xs font-semibold text-wrap text-center pt-2 text-text-primary">
                Pastikan aplikasi berhasil terhubung dengan mesin RVM.
              </p>
            </div>
          </div>
          <div>
            <Image
              src="/svg/P-4.svg"
              alt="panduan-4"
              width={138.44}
              height={122.73}
            />
            <div className=" w-[138.44px]">
              <p className="text-xs font-semibold text-wrap text-center pt-2 text-text-primary">
                Siapkan botol plastik kosong yang akan didaur ulang.
              </p>
            </div>
          </div>
          <div>
            <Image
              src="/svg/P-5.svg"
              alt="panduan-5"
              width={138.44}
              height={122.73}
            />
            <div className=" w-[138.44px]">
              <p className="text-xs font-semibold text-wrap text-center pt-2 text-text-primary">
                Masukkan botol ke dalam lubang input pada mesin.
              </p>
            </div>
          </div>
          <div className="">
            <Image
              src="/svg/P-6.svg"
              alt="panduan-1"
              width={138.44}
              height={122.73}
            />
            <div className=" w-[138.44px]">
              <p className="text-xs font-semibold text-wrap text-center pt-2 text-text-primary">
                Tunggu hingga indikator berwarna hijau, menandakan botol
                berhasil diterima.
              </p>
            </div>
          </div>
          <div>
            <Image
              src="/svg/P-7.svg"
              alt="panduan-7"
              width={138.44}
              height={122.73}
            />
            <div className=" w-[138.44px]">
              <p className="text-xs font-semibold text-wrap text-center pt-2 text-text-primary">
                Tekan tombol "Ambil Poin" pada aplikasi.
              </p>
            </div>
          </div>
          <div>
            <Image
              src="/svg/P-8.svg"
              alt="panduan-8"
              width={138.44}
              height={122.73}
            />
            <div className=" w-[138.44px]">
              <p className="text-xs font-semibold text-wrap text-center pt-2 text-text-primary">
                Poin berhasil diterima dan otomatis masuk ke akun Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
