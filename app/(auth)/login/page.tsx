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
            <div className="w-full max-w-sm">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative">
                        <Image
                            src="/material/Tokodus__1_-removebg-preview.webp"
                            alt="Tokodus"
                            width={140}
                            height={46}
                            className="object-contain mb-3 drop-shadow-md"
                            priority
                        />
                    </div>
                    <p className="text-xs font-medium text-slate-400/80 tracking-wide">
                        Admin Panel
                    </p>
                </div>

                {/* Card */}
                <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 px-8 py-8 transition-all duration-300 hover:shadow-slate-900/20">
                    {/* Decorative top line */}
                    <div className="absolute left-6 right-6 top-0 h-0.5 rounded-full bg-gradient-to-r from-amber-400/40 via-amber-500 to-amber-400/40" />

                    {/* Error Alert */}
                    {error && (
                        <div className="flex items-center gap-2.5 bg-red-50/90 border-l-4 border-red-500 text-red-700 text-sm rounded-xl px-4 py-3 mb-6 shadow-sm">
                            <Icon icon="mdi:alert-circle-outline" className="w-5 h-5 flex-shrink-0 text-red-500" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email Field */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                                Email
                            </label>
                            <div className="relative group">
                                <Icon
                                    icon="mdi:email-outline"
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 transition-colors group-focus-within:text-amber-500"
                                />
                                <input
                                    type="email"
                                    autoFocus
                                    value={form.email}
                                    onChange={e => handleChange('email', e.target.value)}
                                    placeholder="nama@tokodus.com"
                                    disabled={loading}
                                    className="w-full pl-11 pr-4 py-3 text-sm text-slate-700 bg-slate-50/80 border border-slate-200 rounded-xl outline-none placeholder:text-slate-300 focus:bg-white focus:border-amber-300 focus:ring-2 focus:ring-amber-200/60 transition-all duration-200 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                                Password
                            </label>
                            <div className="relative group">
                                <Icon
                                    icon="mdi:lock-outline"
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 transition-colors group-focus-within:text-amber-500"
                                />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => handleChange('password', e.target.value)}
                                    placeholder="••••••••"
                                    disabled={loading}
                                    className="w-full pl-11 pr-12 py-3 text-sm text-slate-700 bg-slate-50/80 border border-slate-200 rounded-xl outline-none placeholder:text-slate-300 focus:bg-white focus:border-amber-300 focus:ring-2 focus:ring-amber-200/60 transition-all duration-200 disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    disabled={loading}
                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors disabled:opacity-40"
                                >
                                    <Icon icon={showPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} className="w-4.5 h-4.5" />
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-200 mt-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <Icon icon="mdi:loading" className="w-4.5 h-4.5 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                'Masuk'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400/70 mt-8 tracking-wide">
                    Hubungi administrator untuk mendapatkan akses
                </p>
            </div>
        </div>
    );
}