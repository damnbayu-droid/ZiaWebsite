'use client'

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
    BookOpen,
    Sparkles,
    Zap,
    ShieldCheck,
    ArrowRight,
    Mic,
    ScanText,
    FileText,
    CheckCircle,
    Smartphone,
    Rocket
} from 'lucide-react'
import { motion } from 'framer-motion'

export function LandingPage({ onPreview, onLogin }: { onPreview: () => void, onLogin: () => void }) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 selection:bg-pink-100 selection:text-pink-600">
            {/* Navigation Placeholder/Simple Header */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Zia Archive</span>
                    </div>
                    <Button onClick={onLogin} variant="ghost" className="font-semibold text-gray-600">
                        Masuk
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 overflow-hidden relative">
                <div className="absolute top-40 left-10 w-72 h-72 bg-pink-100 rounded-full blur-3xl opacity-50 -z-10 animate-pulse" />
                <div className="absolute top-20 right-10 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10 animate-pulse delay-700" />

                <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-bold uppercase tracking-widest mb-6"
                    >
                        <Sparkles className="w-3 h-3" /> Partner Belajar Anak SMA
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 mb-6 leading-[1.1]"
                    >
                        Belajar Lebih <span className="text-pink-600">Pintar</span>,<br />Bukan Lebih Keras.
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg text-gray-500 max-w-2xl mb-10 leading-relaxed"
                    >
                        Zia adalah platform arsip pembelajaran pribadi untuk siswa SMA di Indonesia. Simpan catatan, rekam penjelasan guru, dan kerjakan tugas lebih efisien dengan bantuan AI.
                    </motion.p>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-4 w-full max-w-md px-4"
                    >
                        <Button
                            onClick={onLogin}
                            className="flex-1 h-14 rounded-2xl gradient-primary text-white font-bold text-lg shadow-xl shadow-pink-200 active:scale-95 transition-transform"
                        >
                            Daftar Sekarang
                        </Button>
                        <Button
                            onClick={onPreview}
                            variant="outline"
                            className="flex-1 h-14 rounded-2xl border-2 border-gray-100 font-bold text-lg hover:bg-gray-50 active:scale-95 transition-transform"
                        >
                            Lihat Kedalam
                        </Button>
                    </motion.div>

                    {/* Illustration */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="mt-16 w-full max-w-4xl px-4"
                    >
                        <Image
                            src="/landing-illustration.png"
                            alt="Indonesian High School Students"
                            width={1200}
                            height={800}
                            className="w-full h-auto rounded-3xl shadow-2xl"
                            priority
                        />
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-gray-50 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black mb-4">Fitur Andalan Zia</h2>
                        <p className="text-gray-500">Semua yang kamu butuhkan untuk sukses di sekolah.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Sparkles,
                                title: "Asisten AI Pintar",
                                desc: "Tanya apa saja seputar pelajaran, Zia siap membantu menjelaskan konsep yang sulit dimengerti.",
                                color: "bg-pink-100 text-pink-600"
                            },
                            {
                                icon: ScanText,
                                title: "Pemindai Cerdas (OCR)",
                                desc: "Foto catatan di papan tulis atau buku, Zia akan mengubahnya menjadi teks yang bisa kamu edit.",
                                color: "bg-blue-100 text-blue-600"
                            },
                            {
                                icon: Mic,
                                title: "Perekam Suara Guru",
                                desc: "Rekam penjelasan guru di kelas dan ubah langsung menjadi transkrip teks secara otomatis.",
                                color: "bg-purple-100 text-purple-600"
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                whileInView={{ y: 0, opacity: 1 }}
                                initial={{ y: 20, opacity: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6`}>
                                    <feature.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-24 px-4 overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        whileInView={{ x: 0, opacity: 1 }}
                        initial={{ x: -50, opacity: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <h2 className="text-3xl md:text-5xl font-black leading-tight">
                            Kenapa Anak SMA Harus Pakai <span className="text-pink-600">Zia</span>?
                        </h2>

                        <div className="space-y-6">
                            {[
                                { title: "Rapih & Terorganisir", desc: "Tugas dan catatan tidak akan tercecer lagi. Semua tersimpan aman di satu tempat.", icon: FolderOpen },
                                { title: "Hemat Waktu", desc: "Ubah foto menjadi teks seketika. Tidak perlu capek menyalin ulang dari buku.", icon: Zap },
                                { title: "Belajar Dimana Saja", desc: "Akses materi belajarmu dari HP, tablet, atau laptop kapanpun kamu mau.", icon: Smartphone }
                            ].map((benefit, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-pink-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{benefit.title}</h4>
                                        <p className="text-gray-500 text-sm">{benefit.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            onClick={onLogin}
                            className="h-14 px-8 rounded-2xl gradient-primary text-white font-bold inline-flex items-center gap-2 shadow-lg shadow-pink-200"
                        >
                            Bergabung Sekarang <ArrowRight className="w-5 h-5" />
                        </Button>
                    </motion.div>

                    <motion.div
                        whileInView={{ x: 0, opacity: 1 }}
                        initial={{ x: 50, opacity: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="bg-pink-100 rounded-[3rem] p-8 transform rotate-3 relative z-10">
                            <div className="bg-white rounded-[2rem] p-6 shadow-xl transform -rotate-3 overflow-hidden">
                                <div className="space-y-4">
                                    <div className="h-4 w-1/2 bg-gray-100 rounded-full" />
                                    <div className="h-4 w-3/4 bg-gray-100 rounded-full" />
                                    <div className="grid grid-cols-2 gap-4 mt-8">
                                        <div className="h-32 bg-pink-50 rounded-2xl flex items-center justify-center">
                                            <FileText className="w-8 h-8 text-pink-200" />
                                        </div>
                                        <div className="h-32 bg-blue-50 rounded-2xl flex items-center justify-center">
                                            <CheckCircle className="w-8 h-8 text-blue-200" />
                                        </div>
                                    </div>
                                    <div className="h-4 w-full bg-gray-100 rounded-full mt-4" />
                                </div>
                            </div>
                        </div>
                        {/* Decorative blobs */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-100 rounded-full blur-2xl opacity-50 -z-10" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-200 rounded-full blur-2xl opacity-50 -z-10" />
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-100 px-4 bg-gray-50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <div>
                        <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                            <div className="w-6 h-6 rounded bg-pink-500 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold">Zia Archive</span>
                        </div>
                        <p className="text-sm text-gray-500">© 2026 Zia Archive. Dibuat untuk masa depan pendidikan Indonesia.</p>
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Bantuan</a>
                        <a href="#" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Privasi</a>
                        <a href="#" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Syarat & Ketentuan</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function FolderOpen(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9L11.1 5.4a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
        </svg>
    )
}
