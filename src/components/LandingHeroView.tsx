'use client'

import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight, BookOpen, ShieldCheck, Zap } from 'lucide-react'
import Image from 'next/image'

export function LandingHeroView({ onPreview, onLogin }: { onPreview: () => void, onLogin: () => void }) {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
            {/* Background Ornaments */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-pink-100 rounded-full opacity-50 blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-100 rounded-full opacity-50 blur-3xl animate-pulse" />

            <div className="z-10 max-w-sm w-full space-y-8">
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 mb-6 transform rotate-6 drop-shadow-2xl">
                        <Image
                            src="/image/logo sman 1 kotabunan.webp"
                            alt="Logo SMAN 1 Kotabunan"
                            width={80}
                            height={80}
                            className="w-full h-full object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                        SMAN 1 <span className="text-pink-600">Kotabunan</span>
                    </h1>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Platform pendamping belajar pintar untuk siswa masa kini. Simpan, rekam, dan pindai materi dalam satu genggaman.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <Button
                        onClick={onPreview}
                        className="w-full h-14 rounded-2xl bg-gray-50 text-gray-900 font-bold border-2 border-gray-100 hover:border-pink-200 hover:bg-pink-50 transition-all flex items-center justify-center gap-3 group"
                    >
                        <Zap className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                        Lihat Kedalam
                    </Button>

                    <Button
                        onClick={onLogin}
                        className="w-full h-14 rounded-2xl gradient-primary text-white font-bold text-lg shadow-xl shadow-pink-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        aria-label="Mulai Masuk Sekarang"
                    >
                        Mulai Sekarang <ArrowRight className="w-5 h-5" />
                    </Button>
                </div>

                <div className="pt-8 grid grid-cols-3 gap-4">
                    {[
                        { icon: ShieldCheck, label: 'Aman' },
                        { icon: Zap, label: 'Cepat' },
                        { icon: Sparkles, label: 'Pintar' }
                    ].map((feat) => (
                        <div key={feat.label} className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                <feat.icon className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{feat.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
