'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const READER_ID = 'qr-reader';

// ✅ Deteksi iOS
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

export default function QRScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [currentStream, setCurrentStream] = useState(null);
  const [autoStartFailed, setAutoStartFailed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const scannerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isMounted) {
      initializeScanner();
    }
  }, [isMounted]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      #${READER_ID} {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 1 !important;
        background: #000 !important;
      }
      #${READER_ID} > div {
        width: 100% !important;
        height: 100% !important;
      }
      #${READER_ID} video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        object-position: center !important;
      }
      #${READER_ID} canvas {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        object-position: center !important;
      }
      #${READER_ID}__scan_region {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        z-index: 10 !important;
      }
      #${READER_ID}__scan_region img {
        width: 300px !important;
        height: 300px !important;
        border: 2px solid #00ff00 !important;
        border-radius: 12px !important;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5) !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    return () => {
      cleanupStreams();
    };
  }, []);

  const cleanupStreams = async () => {
    try {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {}
        });
        setCurrentStream(null);
      }

      const activeScanner = scannerRef.current;
      if (activeScanner) {
        try {
          const state = activeScanner.getState();
          if (state === 2) await activeScanner.stop();
        } catch (e) {}
        scannerRef.current = null;
      }

      setIsScanning(false);
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  };

  const requestCameraPermission = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error('Browser tidak mendukung akses kamera.');
    }
    const tempStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    tempStream.getTracks().forEach((track) => track.stop());
  };

  const initializeScanner = async () => {
    console.log('🔄 User triggered initialization...');
    setIsInitializing(true);
    setAutoStartFailed(false);
    setCameraError(null);

    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => setTimeout(resolve, 100));

      const element = document.getElementById(READER_ID);
      if (!element) {
        throw new Error('Reader element not found. Coba refresh halaman.');
      }

      try {
        await requestCameraPermission();
      } catch (permErr) {
        throw new Error('Kamera tidak diizinkan. Periksa settings browser.');
      }

      const qrScanner = new Html5Qrcode(READER_ID);
      scannerRef.current = qrScanner;

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');

      setCameras(videoDevices);

      if (videoDevices.length === 0) {
        throw new Error('Tidak ada kamera ditemukan di device.');
      }

      const backCamera = videoDevices.find((device) => {
        const label = device.label.toLowerCase();
        return (
          label.includes('back') ||
          label.includes('environment') ||
          label.includes('rear') ||
          label.includes('world')
        );
      });

      const cameraToUse =
        backCamera || videoDevices[videoDevices.length - 1] || videoDevices[0];
      const selectedIndex = Math.max(
        0,
        videoDevices.findIndex(
          (device) => device.deviceId === cameraToUse.deviceId
        )
      );
      setCurrentCameraIndex(selectedIndex >= 0 ? selectedIndex : 0);
      console.log(
        '🎥 Using camera:',
        cameraToUse.label || cameraToUse.deviceId
      );

      await startScanning(qrScanner, cameraToUse.deviceId);
      setAutoStartFailed(false);
    } catch (error) {
      console.error('Error initializing cameras:', error);
      setCameraError(error?.message || String(error));
      setAutoStartFailed(true);
    } finally {
      setIsInitializing(false);
    }
  };

  const restartWithCamera = async (cameraIndex) => {
    const selectedCamera = cameras[cameraIndex];
    if (!selectedCamera) return;

    setCurrentCameraIndex(cameraIndex);
    setIsInitializing(true);
    setCameraError(null);
    await cleanupStreams();

    try {
      await requestCameraPermission();
      const newScanner = new Html5Qrcode(READER_ID);
      scannerRef.current = newScanner;
      await startScanning(newScanner, selectedCamera.deviceId);
    } catch (error) {
      console.error('Swap camera error:', error);
      setCameraError(error?.message || String(error));
      setAutoStartFailed(true);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSwapCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    await restartWithCamera(nextIndex);
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch {
      if (string.startsWith('/')) return true;
      if (string.includes('localhost') || string.includes('127.0.0.1'))
        return true;
      return false;
    }
  };

  const handleScanSuccess = async (decodedText, qrScanner) => {
    console.log('🎯 QR Code Detected:', decodedText);
    setScanResult(decodedText);

    try {
      await qrScanner.stop();
    } catch (e) {}
    setIsScanning(false);
    await cleanupStreams();

    if (decodedText.includes('bottlein') || decodedText.includes('/bottlein')) {
      try {
        const url = new URL(decodedText, window.location.origin);
        setTimeout(() => router.push(url.pathname + url.search), 500);
      } catch {
        setTimeout(
          () =>
            router.push(
              decodedText.includes('?')
                ? decodedText.slice(decodedText.indexOf('/bottlein'))
                : '/bottlein'
            ),
          500
        );
      }
      return;
    }
    if (decodedText.includes('localhost:3000')) {
      try {
        const url = new URL(decodedText);
        setTimeout(() => router.push(url.pathname + url.search), 500);
      } catch {
        setTimeout(() => router.push('/bottlein'), 500);
      }
      return;
    }
    if (decodedText.startsWith('/')) {
      setTimeout(() => router.push(decodedText), 500);
      return;
    }
    if (isValidUrl(decodedText)) {
      if (decodedText.startsWith('http')) window.location.href = decodedText;
      else setTimeout(() => router.push(decodedText), 500);
      return;
    }

    alert(`QR Code: ${decodedText}\nMengarahkan ke halaman Bottle In...`);
    setTimeout(() => router.push('/bottlein'), 1000);
  };

  const startScanning = async (qrScanner, deviceId) => {
    console.log('🎥 Starting camera scan...', { deviceId, isIOS: isIOS() });
    setCameraError(null);
    setIsScanning(false);

    // ✅ Config khusus iOS vs Android
    const iosVideoConstraints = {
      facingMode: { ideal: 'environment' },
      // iOS: pakai resolusi rendah biar tidak zoom
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
    };

    const androidVideoConstraints = {
      deviceId: { exact: deviceId },
    };

    const attempts = isIOS()
      ? [
          // iOS: prioritas facingMode, jangan pakai deviceId (sering bermasalah di Safari)
          {
            type: 'facingMode',
            value: 'environment',
            constraints: iosVideoConstraints,
          },
          {
            type: 'facingMode',
            value: 'user',
            constraints: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
        ]
      : [
          // Android: prioritas deviceId
          {
            type: 'deviceId',
            value: deviceId,
            constraints: { deviceId: { exact: deviceId } },
          },
          {
            type: 'facingMode',
            value: 'environment',
            constraints: { facingMode: { ideal: 'environment' } },
          },
          {
            type: 'facingMode',
            value: 'user',
            constraints: { facingMode: { ideal: 'user' } },
          },
        ];

    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      try {
        console.log(`Attempt ${i + 1}:`, attempt.type, attempt.value);

        // Pre-test stream dengan constraint yang sudah disesuaikan
        try {
          const testStream = await navigator.mediaDevices.getUserMedia({
            video: attempt.constraints,
            audio: false,
          });
          setCurrentStream(testStream);
          console.log(`✅ Stream test passed`);
        } catch (streamErr) {
          console.warn(`Stream test failed:`, streamErr?.message);
          if (i < attempts.length - 1) continue;
          throw streamErr;
        }

        // ✅ Untuk iOS pakai facingMode string, Android pakai deviceId
        const startParam =
          attempt.type === 'deviceId' ? attempt.value : undefined;

        // ✅ qrbox lebih kecil di iOS biar tidak terasa zoom
        const qrboxFn = (width, height) => {
          const minDim = Math.min(width, height);
          const size = isIOS()
            ? Math.floor(minDim * 0.5) // iOS: 50% dari layar
            : Math.floor(minDim * 0.6); // Android: 60% dari layar
          return { width: size, height: size };
        };

        await qrScanner.start(
          // ✅ iOS: pakai object facingMode, bukan deviceId string
          isIOS() ? { facingMode: 'environment' } : startParam,
          {
            fps: isIOS() ? 10 : 20, // ✅ iOS fps lebih rendah, lebih stabil
            qrbox: qrboxFn,
            // ✅ iOS: tambahkan videoConstraints langsung ke config
            videoConstraints: attempt.constraints,
          },
          (decodedText) => handleScanSuccess(decodedText, qrScanner),
          (error) => {
            if (!String(error).includes('No QR code found'))
              console.warn('Scan error:', error);
          }
        );

        setIsScanning(true);
        console.log('✅ Camera started with', attempt.type);
        return;
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed:`, error?.message || error);
        if (i === attempts.length - 1) {
          setCameraError(`Camera failed: ${error?.message || String(error)}`);
          setIsScanning(false);
        }
      }
    }
  };

  const goToPanduan = () =>
    cleanupStreams().then(() => router.push('/panduan'));
  const goHome = () => cleanupStreams().then(() => router.push('/home'));

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {isMounted && <div id={READER_ID} className="w-full h-full" />}

      {isInitializing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
            <p>Memuat kamera...</p>
          </div>
        </div>
      )}

      {!isMounted && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
            <p>Memuat halaman...</p>
          </div>
        </div>
      )}

      {/* Top UI */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex justify-between items-center">
          <button
            onClick={goHome}
            className="text-white bg-black/50 rounded-full p-2"
          >
            <Image
              src="/svg/image-back.svg"
              alt="Back"
              width={14}
              height={25}
            />
          </button>
          <div className="text-white text-lg font-semibold">Scan QR Code</div>
          <div className="w-10 h-10" />
        </div>
      </div>

      {/* Bottom UI */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/80 via-black/55 to-transparent">
        <div className="text-center">
          <div className="text-white text-sm mb-4">
            Arahkan kamera ke QR code
          </div>

          <div className="flex items-center justify-center mb-4">
            <div
              className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-400' : 'bg-red-400'} mr-2`}
            />
            <span className="text-white text-sm">
              {isScanning ? 'Camera Active' : 'Camera Inactive'}
            </span>
          </div>

          <div className="mx-auto flex h-16 w-full max-w-sm items-center justify-between rounded-2xl bg-white px-6 shadow-lg">
            <button
              type="button"
              onClick={handleSwapCamera}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-transparent"
              aria-label="Swap camera"
            >
              <Image
                src="/svg/switch-camera.svg"
                alt="Swap camera"
                width={28}
                height={28}
              />
            </button>

            <button
              type="button"
              onClick={goToPanduan}
              className="flex h-10 w-10 items-center justify-center rounded-full"
              aria-label="Panduan"
            >
              <Image
                src="/svg/panduan.svg"
                alt="Panduan"
                width={28}
                height={28}
              />
            </button>
          </div>

          {cameraError && (
            <div className="mt-4 text-red-400 text-sm">{cameraError}</div>
          )}

          {scanResult && (
            <div className="mt-2 text-green-400 text-sm">
              Scan Result: {scanResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
