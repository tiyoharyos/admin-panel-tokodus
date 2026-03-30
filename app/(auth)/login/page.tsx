'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginService } from '@/services/auth.service';
import { setToken } from '@/lib/auth';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import Swal from 'sweetalert2';

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

        if (!form.email || !form.password) {
            setError('Email dan password harus diisi');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const data = await loginService(form);
            setToken(data.access_token);

            await Swal.fire({
                icon: 'success',
                title: 'Login Berhasil',
                text: 'Selamat datang kembali!',
                showConfirmButton: false,
                timer: 1500,
            });

            router.push('/dashboard');
            router.refresh();
        } catch (err: unknown) {
            const e = err as ErrorResponse;

            const message =
                e.response?.data?.message ||
                e.response?.data?.error ||
                e.message ||
                'Login gagal. Periksa email & password.';

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

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (error) setError('');
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{
                background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            }}
        >
            <div className="w-full max-w-md">

                {/* Card */}
                <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8">

                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-black rounded-xl px-5 py-3 shadow-md">
                            <Image
                                src="/material/Tokodus__1_-removebg-preview.webp"
                                alt="Tokodus"
                                width={120}
                                height={40}
                                className="h-8 w-auto object-contain"
                                priority
                            />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">
                            Welcome Back
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Sistem Manajemen Produksi & Packaging
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 flex items-start gap-2 text-sm bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2">
                            <Icon icon="solar:danger-circle-bold" className="w-4 h-4 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-4">

                        {/* Email */}
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <div className="relative mt-1">
                                <Icon
                                    icon="solar:letter-bold-duotone"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="email"
                                    autoFocus
                                    value={form.email}
                                    onChange={e => handleChange('email', e.target.value)}
                                    placeholder="Masukkan email"
                                    disabled={loading}
                                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-gray-700
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                                    disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="relative mt-1">
                                <Icon
                                    icon="solar:lock-password-bold-duotone"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => handleChange('password', e.target.value)}
                                    placeholder="Masukkan password"
                                    disabled={loading}
                                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 text-gray-700
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                                    disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    disabled={loading}
                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
                                >
                                    <Icon icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} width={17} height={17} />
                                </button>
                            </div>
                        </div>

                        {/* Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg
                            transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Icon icon="svg-spinners:ring-resize" />
                                    Memproses...
                                </span>
                            ) : (
                                'Masuk'
                            )}
                        </button>

                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center text-xs text-gray-500">
                        Hubungi administrator untuk mendapatkan akses
                    </div>
                </div>

                {/* Bottom */}
                <p className="text-center text-xs text-gray-400 mt-4">
                    Powered by Tokodus Admin Platform
                </p>
            </div>
        </div>
    );
}