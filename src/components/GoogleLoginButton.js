'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUserContext } from '../contexts/UserContextNew';

export default function GoogleLoginButton({ className = '' }) {
  const router = useRouter();
  const { refreshUserData } = useUserContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError('');

    try {
      console.log('Google login success, credential received');
      console.log('Credential type:', typeof credentialResponse.credential);

      if (!credentialResponse.credential) {
        setError('Credential tidak ditemukan');
        setIsLoading(false);
        return;
      }

      console.log('📤 Sending credential to backend...');
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: credentialResponse.credential,
        }),
      });

      console.log('📊 Response status:', response.status);

      const data = await response.json().catch((err) => {
        console.error('❌ Failed to parse response as JSON:', err);
        return null;
      });

      console.log('📦 Response data:', data);

      if (!response.ok) {
        console.error('❌ Google auth failed:', data);
        setError(data?.error || `Error: ${response.status}`);
        setIsLoading(false);
        return;
      }

      console.log('✅ Google auth success, redirecting...');

      console.log('🔄 Refreshing user data after Google login...');
      refreshUserData();

      await new Promise(resolve => setTimeout(resolve, 500));

      router.push('/home');
    } catch (err) {
      console.error('❌ Google login error:', err);
      setError('Terjadi kesalahan: ' + err.message);
      setIsLoading(false);
    }
  };

  const handleError = () => {
    console.error('❌ Login Failed');
    setError('Login Google gagal');
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-center rounded-xl border-2 border-secondary">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          text="signin_with"    
          width="208"
          locale="id"
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
