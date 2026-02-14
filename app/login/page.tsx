'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginService } from '@/services/auth.service'
import { setToken } from '@/lib/auth'
import Image from 'next/image';
import { Icon } from '@iconify/react';
import Swal from 'sweetalert2';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();



const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    const data = await loginService(form)

    setToken(data.access_token)

    await Swal.fire({
      icon: 'success',
      title: 'Login Berhasil',
      text: 'Selamat datang kembali!',
      showConfirmButton: false,
      timer: 1500,
      backdrop: true
    })

    router.push('/dashboard')
    router.refresh()

  } catch (err: any) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      'Login gagal. Periksa email & password.'

    setError(message)

    Swal.fire({
      icon: 'error',
      title: 'Login Gagal',
      text: message,
      confirmButtonText: 'Coba Lagi'
    })

  } finally {
    setLoading(false)
  }
}


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin(e as any);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  


  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a3a7d 0%, #1f4390 50%, #2557b8 100%)' }}>


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

          {/* Error Message */}
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

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center text-xs text-gray-500 mb-2">
                <Icon icon="solar:shield-check-bold-duotone" className="w-4 h-4 mr-1.5 text-gray-400" />
                <p>Hubungi administrator untuk mendapatkan akses</p>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-white/70 font-medium">
            Powered by Tokodus Admin Platform
          </p>
        </div>
      </div>

      {/* Inline CSS Animations */}
      <style jsx>{`
  
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
