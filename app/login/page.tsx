'use client'; 

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from '../../lib/axios';
import Image from 'next/image';
import { Icon } from '@iconify/react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await axios.post('/Auth/login', form);
      const { access_token } = res.data;
      localStorage.setItem('token', access_token);
    //   alert('Logged in successfully');
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Ambil pesan error dari response API
      if (error.response) {
        // Server memberikan response dengan status code error
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error ||
                           'Login failed';
        setError(errorMessage);
      } else if (error.request) {
        // Request dikirim tapi tidak ada response
        setError('Tidak ada response dari server. Periksa koneksi internet Anda.');
      } else {
        // Error saat setup request
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin(e as any);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error ketika user mulai mengetik
    if (error) setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a3a7d 0%, #1f4390 50%, #2557b8 100%)' }}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-300 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <div className="relative group">
                <div className="relative bg-black rounded-2xl p-4 shadow-lg border border-blue-100">
                  <Image 
                    src="/material/Tokodus__1_-removebg-preview.webp" 
                    alt="Tokodus"
                    width={140}
                    height={40}
                    className="h-10 w-auto object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-500 text-sm font-medium">Sign in to access your dashboard</p>
          </div>

          {/* Error Message - Tampilkan pesan dari API */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-shake">
              <div className="flex items-start">
                <Icon icon="solar:danger-circle-bold" className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-red-700 text-sm block">Login Gagal</span>
                  <p className="text-sm text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleLogin}>
            <div className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-200">
                    <Icon icon="solar:letter-bold-duotone" className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-12 pr-4 py-3.5 border text-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:bg-gray-100 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
                      error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                    }`}
                    placeholder="Masukkan email"
                    
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-200">
                    <Icon icon="solar:lock-password-bold-duotone" className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-12 pr-12 py-3.5 text-gray-700 border rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:bg-gray-100 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
                      error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                    }`}
                    placeholder="Masukkan password"
                
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    disabled={loading}
                  >
                    <Icon 
                      icon={showPassword ? "solar:eye-bold" : "solar:eye-closed-bold"} 
                      className="w-5 h-5" 
                    />
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full font-semibold py-3.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-white"
                style={{ 
                  background: 'linear-gradient(135deg, #1f4390 0%, #2557b8 100%)',
                  boxShadow: '0 10px 25px -5px rgba(31, 67, 144, 0.3)'
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Icon icon="svg-spinners:ring-resize" className="w-5 h-5 mr-2" />
                    Memproses...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>Masuk</span>
                    <Icon icon="solar:arrow-right-bold" className="w-5 h-5 ml-2" />
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link 
                href="/register" 
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                Register here
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Icon icon="solar:shield-check-bold-duotone" className="w-4 h-4 mr-1.5 text-gray-400" />
              <p>Hubungi administrator untuk mendapatkan akses</p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-white/70 font-medium">
            Powered by Tokodus Admin Platform
          </p>
        </div>
      </div>

      {/* Inline CSS Animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
}