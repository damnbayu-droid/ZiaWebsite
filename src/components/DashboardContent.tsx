'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Book, FileText, CheckCircle, Clock, Users, ArrowRight, Mic, ScanText, MessageSquare, FolderOpen, Trophy, Bell } from 'lucide-react'
import AIAssistant from '@/components/AIAssistant'
import { ActionBlocker } from './ActionBlocker'
import { BottomNav } from './BottomNav'

interface DashboardContentProps {
    user: any
    assignments: any[] | null
    recentActivity: any[] | null
    isGuest?: boolean
}

export function DashboardContent({ user, assignments, recentActivity, isGuest = false }: DashboardContentProps) {
    return (
        <div className="min-h-screen bg-gray-50 pb-44 safe-area-inset-bottom">
            {/* Header */}
            <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm flex justify-between items-center">
                <div>
                    <p className="text-xs text-gray-400">Selamat datang,</p>
                    <h1 className="text-xl font-bold text-gray-900">
                        {isGuest ? 'Halo, Calon Siswa! 👋' : `${user?.user_metadata?.full_name || 'Siswa'}! 👋`}
                    </h1>
                </div>
                {!isGuest && (
                    <div className="flex items-center gap-1">
                        <Link href="/notifications">
                            <Button size="icon" variant="ghost" className="rounded-full relative" aria-label="Lihat Notifikasi">
                                <Bell className="w-6 h-6 text-gray-600" />
                                <div className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border border-white" />
                            </Button>
                        </Link>
                        <Link href="/messages">
                            <Button size="icon" variant="ghost" className="rounded-full relative" aria-label="Buka Pesan">
                                <MessageSquare className="w-6 h-6 text-gray-600" />
                                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white flex items-center justify-center text-[8px] text-white font-bold">
                                    3
                                </div>
                            </Button>
                        </Link>
                    </div>
                )}
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* AI Assistant Card */}
                <ActionBlocker isGuest={isGuest}>
                    <AIAssistant />
                </ActionBlocker>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: 'Pelajaran', icon: Book, href: '/subjects', color: 'bg-pink-100 text-pink-600' },
                        { label: 'Tugas', icon: CheckCircle, href: '/assignments', color: 'bg-orange-100 text-orange-600' },
                        { label: 'Catatan', icon: FileText, href: '/notes', color: 'bg-blue-100 text-blue-600' },
                        { label: 'Kelas', icon: Users, href: '/classes', color: 'bg-green-100 text-green-600' },
                        { label: 'Arena', icon: Trophy, href: '/arena', color: 'bg-yellow-100 text-yellow-600' },
                        { label: 'Rekam', icon: Mic, href: '/recordings', color: 'bg-purple-100 text-purple-600' },
                        { label: 'Pindai', icon: ScanText, href: '/scan', color: 'bg-indigo-100 text-indigo-600' },
                        { label: 'Materi', icon: FolderOpen, href: '/materials', color: 'bg-teal-100 text-teal-600' },
                    ].map((item) => (
                        <ActionBlocker key={item.label} isGuest={isGuest}>
                            <Link
                                href={isGuest ? '#' : item.href}
                                className="flex flex-col items-center gap-2 group"
                                aria-label={`Buka menu ${item.label}`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-active:scale-95 ${item.color}`}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-gray-600">{item.label}</span>
                            </Link>
                        </ActionBlocker>
                    ))}
                </div>

                {/* Pending Assignments Widget */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-lg text-gray-900">Tugas Tertunda</h2>
                        {!isGuest && (
                            <Link href="/assignments" className="text-xs font-semibold text-pink-600">Lihat Semua</Link>
                        )}
                    </div>
                    <div className="space-y-3">
                        {!assignments || assignments.length === 0 ? (
                            <p className="text-center py-6 text-sm text-gray-400 border-2 border-dashed rounded-2xl">Tidak ada tugas tertunda.</p>
                        ) : (
                            assignments.map((asgn) => (
                                <ActionBlocker key={asgn.id} isGuest={isGuest}>
                                    <Link href={isGuest ? '#' : `/assignments/${asgn.id}`}>
                                        <Card className="p-4 flex items-center gap-4 border-0 shadow-sm rounded-2xl">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-sm truncate">{asgn.title}</h3>
                                                <p className="text-xs text-gray-400">Tenggat: {asgn.due_date ? new Date(asgn.due_date).toLocaleDateString('id-ID') : '-'}</p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-gray-300" />
                                        </Card>
                                    </Link>
                                </ActionBlocker>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Class Activity Widget */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-lg text-gray-900">Aktivitas Terkini</h2>
                        {!isGuest && (
                            <Link href="/classes" className="text-xs font-semibold text-pink-600">Lihat Kelas</Link>
                        )}
                    </div>
                    {!recentActivity || recentActivity.length === 0 ? (
                        <p className="text-center py-6 text-sm text-gray-400 border-2 border-dashed rounded-2xl">Belum ada aktivitas.</p>
                    ) : (
                        <Card className="p-4 border-0 shadow-sm rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-300 mb-1">{recentActivity[0].action}</p>
                                    <p className="text-sm font-medium line-clamp-2">
                                        {recentActivity[0].details?.description || 'Aktivitas sistem baru tercatat.'}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </main>
            <BottomNav />
        </div>
    )
}
