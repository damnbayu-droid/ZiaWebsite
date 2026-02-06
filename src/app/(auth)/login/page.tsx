'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Loader2, Lock, Mail, Eye, EyeOff, User } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!email.trim() || !password.trim()) {
            setError('Mohon isi email dan kata sandi');
            setLoading(false);
            return;
        }

        if (isSignUp && !fullName.trim()) {
            setError('Mohon isi nama lengkap');
            setLoading(false);
            return;
        }

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });

                if (error) {
                    if (error.message.includes('rate limit')) {
                        setError('Terlalu banyak percobaan. Mohon tunggu beberapa saat atau hubungi Admin.');
                    } else if (error.message.includes('User already registered')) {
                        setError('Email sudah terdaftar. Silakan masuk.');
                    } else if (error.message.includes('Signups not allowed')) {
                        setError('Pendaftaran akun baru sedang dinonaktifkan oleh Admin (Supabase Settings).');
                    } else {
                        setError(error.message);
                    }
                } else {
                    // Check if session was created (auto sign in)
                    // Usually signUp returns session if email confirmation is off, 
                    // or null if on. Assuming off for private app or handled.
                    setError(null);
                    setIsSignUp(false);
                    setPassword('');
                    alert('Akun berhasil dibuat! Silakan masuk (Menunggu Verifikasi Admin).');
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    setError('Email atau kata sandi salah. Silakan coba lagi.');
                } else {
                    router.refresh();
                    // Direct Admin to Dashboard
                    if (email === 'damnbayu@gmail.com') {
                        router.push('/admin');
                    } else {
                        router.push('/');
                    }
                }
            }
        } catch (err) {
            setError('Terjadi kesalahan yang tidak terduga.');
            console.error(err);
        }

        setLoading(false);
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setError(null);
        setEmail('');
        setPassword('');
        setFullName('');
    };

    const handleResetPassword = async () => {
        if (!email.trim()) {
            setError('Mohon isi email terlebih dahulu untuk mereset kata sandi.');
            return;
        }
        try {
            setLoading(true);
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/profile/update-password`,
            });
            if (error) throw error;
            alert('Tautan reset kata sandi telah dikirim ke email Anda via Supabase (cek spam juga).');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Gagal mengirim tautan reset.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen gradient-pink flex items-center justify-center p-4 safe-area-inset-top safe-area-inset-bottom">
            <div className="w-full max-w-sm">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/image/logo sman 1 kotabunan.webp"
                            alt="Logo SMAN 1 Kotabunan"
                            className="w-24 h-24 object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        Learning APP Zia
                    </h1>
                    <p className="text-sm text-gray-600">
                        Ruang Belajar Teman-teman zia
                    </p>
                </div>

                {/* Login Card */}
                <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-bold text-center">
                            {isSignUp ? 'Buat Akun' : 'Selamat Datang! 👋'}
                        </CardTitle>
                        <CardDescription className="text-center text-sm">
                            {isSignUp
                                ? 'Mulai perjalanan belajarmu hari ini'
                                : 'Masukkan detailmu untuk lanjut belajar'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Full Name Field (Sign Up Only) */}
                            {isSignUp && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                    <Label htmlFor="fullName" className="text-sm font-medium">
                                        Nama Lengkap
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="fullName"
                                            type="text"
                                            placeholder="Nama Lengkap"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="pl-10 h-12 rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="email@sekolah.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-12 rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            {/* Forgot Password Link */}
                            {!isSignUp && (
                                <div className="flex justify-end -mt-2"> {/* Adjusted margin to bring it closer to email field */}
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                                    >
                                        Lupa Kata Sandi?
                                    </Link>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-medium">
                                        Kata Sandi
                                    </Label>
                                </div>

                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 p-1"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 rounded-xl gradient-primary text-white font-semibold text-base hover:opacity-90 transition-opacity"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {isSignUp ? 'Membuat Akun...' : 'Masuk...'}
                                    </span>
                                ) : (
                                    isSignUp ? 'Buat Akun' : 'Masuk'
                                )}
                            </Button>

                            {/* Toggle Mode */}
                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={toggleMode}
                                    className="text-sm text-gray-500 hover:text-pink-500 transition-colors flex items-center justify-center gap-1 mx-auto"
                                    disabled={loading}
                                >
                                    {isSignUp
                                        ? 'Sudah punya akun? Masuk'
                                        : "Belum punya akun? Buat baru"}
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    Pribadi & Aman • Khusus untuk Siswa
                </p>
            </div>
        </div >
    );
}
