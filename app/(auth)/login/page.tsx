'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginService } from '@/services/auth.service';
import { setToken } from '@/lib/auth';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import Swal from 'sweetalert2';

// Tambahkan interface untuk error response
interface ErrorResponse {
    response?: {
        data?: {
            message?: string;
            error?: string;
        }
    };
    message?: string;
}

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validasi form
        if (!form.email || !form.password) {
            setError('Email dan password harus diisi');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const data = await loginService(form);
            setToken(data.access_token);

            // Notifikasi sukses
            await Swal.fire({
                icon: 'success',
                title: 'Login Berhasil',
                text: 'Selamat datang kembali!',
                showConfirmButton: false,
                timer: 1500,
                backdrop: true,
            });

            router.push('/dashboard');
            router.refresh();
        } catch (err: unknown) {
            const error = err as ErrorResponse;
            
            // Ambil pesan error dengan lebih baik
            let message = 'Login gagal. Periksa email & password.';
            
            if (error.response?.data?.message) {
                message = error.response.data.message;
            } else if (error.response?.data?.error) {
                message = error.response.data.error;
            } else if (error.message) {
                message = error.message;
            }

            setError(message);
            
            Swal.fire({
                icon: 'error',
                title: 'Login Gagal',
                text: message,
                confirmButtonText: 'Coba Lagi',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (error) setError('');
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a3a7d 0%, #1f4390 50%, #2557b8 100%)' }}
        >
            <div className="w-full max-w-md relative z-10">
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">

                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-5">
                            <div className="bg-black rounded-2xl p-4 shadow-lg border border-blue-100">
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
                        <h1 className="text-3xl font-bold text-blue-600 mb-2">Welcome Back</h1>
                        <p className="text-gray-500 text-sm font-medium">Sign in to access your dashboard</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-shake">
                            <div className="flex items-start gap-3">
                                <Icon icon="solar:danger-circle-bold" className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="font-semibold text-red-700 text-sm block">Login Gagal</span>
                                    <p className="text-sm text-red-600 mt-0.5">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} noValidate>
                        <div className="space-y-5">

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Icon
                                        icon="solar:letter-bold-duotone"
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                    />
                                    <input
                                        id="email"
                                        type="email"
                                        value={form.email}
                                        onChange={e => handleInputChange('email', e.target.value)}
                                        placeholder="Masukkan email"
                                        disabled={loading}
                                        autoComplete="email"
                                        className={`w-full pl-12 pr-4 py-3.5 border text-gray-700 rounded-xl
                                            focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                                            hover:bg-gray-100 focus:bg-white
                                            transition-all duration-200
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                            ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Icon
                                        icon="solar:lock-password-bold-duotone"
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                    />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={e => handleInputChange('password', e.target.value)}
                                        placeholder="Masukkan password"
                                        disabled={loading}
                                        autoComplete="current-password"
                                        className={`w-full pl-12 pr-12 py-3.5 text-gray-700 border rounded-xl
                                            focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                                            hover:bg-gray-100 focus:bg-white
                                            transition-all duration-200
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                            ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        disabled={loading}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                    >
                                        <Icon
                                            icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                                            className="w-5 h-5"
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full font-semibold py-3.5 px-4 rounded-xl text-white
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    transition-all duration-200 shadow-lg hover:shadow-xl
                                    hover:-translate-y-0.5 transform"
                                style={{
                                    background: 'linear-gradient(135deg, #1f4390 0%, #2557b8 100%)',
                                    boxShadow: '0 10px 25px -5px rgba(31, 67, 144, 0.3)',
                                }}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Icon icon="svg-spinners:ring-resize" className="w-5 h-5" />
                                        Memproses...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Masuk
                                        <Icon icon="solar:arrow-right-bold" className="w-5 h-5" />
                                    </span>
                                )}
                            </button>

                        </div>
                    </form>

                    {/* Footer Info */}
                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                            <Icon icon="solar:shield-check-bold-duotone" className="w-4 h-4 text-gray-400" />
                            <p>Hubungi administrator untuk mendapatkan akses</p>
                        </div>
                    </div>

                </div>

                {/* Bottom Footer */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-white/70 font-medium">Powered by Tokodus Admin Platform</p>
                </div>
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                    20%, 40%, 60%, 80% { transform: translateX(2px); }
                }
                .animate-shake { animation: shake 0.5s; }
            `}</style>
        </div>
    );
}