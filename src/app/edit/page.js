'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    phoneNumber: '',
    id: '',
  });

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/profile', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 200) {
          setFormData({
            nama: result.data.nama || '',
            email: result.data.email || '',
            phoneNumber: result.data.phoneNumber || '',
            id: result.data.id || '',
          });
        } else {
          setError('Gagal memuat data profile');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Gagal memuat data profile');

        // Redirect to login if unauthorized
        if (response.status === 401) {
          router.push('/login');
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.nama.trim()) {
      setError('Nama lengkap wajib diisi');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setError('Nomor handphone wajib diisi');
      return;
    }

    // Phone number validation
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError('Format nomor handphone tidak valid');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          nama: formData.nama.trim(),
          phoneNumber: formData.phoneNumber.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.code === 200) {
        setSuccess('Profile berhasil diperbarui!');
        // Redirect to profile page after 2 seconds
        setTimeout(() => {
          router.push('/profil');
        }, 2000);
      } else {
        setError(result.message || 'Gagal memperbarui profile');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menyimpan data');
      console.error('Update profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-primary h-screen flex items-center justify-center">
        <div className="text-bgSecondary text-lg">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="bg-primary pt-[35px] min-h-screen flex flex-col">
      {/* Header */}
      <div className="justify-center">
        <Link href="/profil" className="absolute left-6 top-[44px]">
          <Image src="/svg/image-back.svg" alt="Back" width={14} height={25} />
        </Link>
        <h1 className="text-bgSecondary font-semibold w-full text-center text-[24px] pb-6 pt-1">
          Edit Profil
        </h1>
      </div>

      {/* Profile Section */}
      <div className="bg-bgSecondary rounded-t-[36px] py-10 px-9 mt-20 relative flex-1">
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          {/* Avatar */}
          <div className="absolute -top-16 w-[130px] h-[130px] rounded-full bg-text-primary flex items-center justify-center">
            <Image
              src="/svg/icon-user.svg"
              alt="icon user"
              width={80}
              height={80}
            />
          </div>

          {/* Username */}
          <h1 className="text-text-primary font-semibold text-2xl mt-[60px] mb-6">
            {formData.nama || 'User'}
          </h1>

          {/* Error/Success Messages */}
          {error && (
            <div className="w-full mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="w-full mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Input Fields */}
          <div className="w-full space-y-4">
            <Field
              label="Nama Lengkap *"
              value={formData.nama}
              onChange={(value) => handleInputChange('nama', value)}
              placeholder="Masukkan nama lengkap"
              required
            />

            <Field
              label="Email"
              value={formData.email}
              type="email"
              disabled
              className="bg-gray-100 !text-gray-500"
              placeholder="Email tidak dapat diubah"
            />

            <Field
              label="ID User"
              value={formData.id}
              disabled
              className="bg-gray-100 !text-gray-500"
              placeholder="ID user tidak dapat diubah"
            />

            <Field
              label="No Handphone *"
              value={formData.phoneNumber}
              onChange={(value) => handleInputChange('phoneNumber', value)}
              placeholder="081234567890"
              type="tel"
              required
            />
          </div>

          {/* Buttons */}
          <div className="mt-10 flex gap-4">
            <Link href="/profil">
              <button
                type="button"
                className="py-3 px-6 bg-gray-500 text-white font-semibold text-lg rounded-xl shadow-md hover:bg-gray-600"
              >
                Batal
              </button>
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 bg-primary text-bgSecondary font-semibold text-lg rounded-xl shadow-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Reusable Input Field Component
function Field({
  label,
  value = '',
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  required = false,
  className = '',
}) {
  return (
    <div>
      <label className="text-text-primary text-sm font-medium block mb-1">
        {label.split('*').map((part, index, parts) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 && (
              <span className="text-red-500">*</span>
            )}
          </span>
        ))}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full p-3 border-[3px] border-secondary rounded-[10px] text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${className}`}
      />
    </div>
  );
}
