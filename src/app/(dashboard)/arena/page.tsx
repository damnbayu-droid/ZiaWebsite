'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Trophy,
    Zap,
    Users,
    Star,
    ChevronRight,
    Play,
    Crown,
    TrendingUp,
    Loader2
} from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { TriviaGame } from '@/components/arena/TriviaGame'
import { MathBlitz } from '@/components/arena/MathBlitz'

const ARENA_MODES = [
    {
        slug: 'math-blitz',
        name: 'Math Blitz',
        desc: 'Hitung cepat! Asah otakmu dengan tantangan angka!',
        icon: Zap,
        color: 'bg-yellow-500',
    },
    {
        slug: 'english-duel',
        name: 'English Duel',
        desc: 'Uji kemampuan grammar & vocab SMA-mu!',
        icon: Zap,
        color: 'bg-blue-500',
    },
    {
        slug: 'cerdas-cermat',
        name: 'Cerdas Cermat',
        desc: 'Seru-seruan asah wawasan nusantara!',
        icon: Trophy,
        color: 'bg-amber-500',
    }
]

export default function ArenaPage() {
    const supabase = createClient()
    const [view, setView] = useState<'hub' | 'playing'>('hub')
    const [selectedArena, setSelectedArena] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: prof } = await supabase
                .from('arena_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single()
            setProfile(prof)

            const { data: leaders } = await supabase
                .from('arena_profiles')
                .select('*, profiles:user_id(full_name, avatar_url)')
                .order('total_xp', { ascending: false })
                .limit(5)
            setLeaderboard(leaders || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const startPlaying = (arenaSlug: string) => {
        setSelectedArena(arenaSlug)
        setView('playing')
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
    )

    if (view === 'playing') {
        if (selectedArena === 'math-blitz') {
            return <MathBlitz onBack={() => setView('hub')} />
        }
        return <TriviaGame arenaSlug={selectedArena} onBack={() => setView('hub')} profile={profile} />
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32 safe-area-inset-bottom">
            <header className="bg-white px-4 py-6 sticky top-0 z-10 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        Zia Arena <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    </h1>
                    <p className="text-xs text-gray-400">Asah otak & kumpulkan XP!</p>
                </div>
                {profile && (
                    <div className="flex items-center gap-2 bg-pink-50 px-3 py-1.5 rounded-2xl border border-pink-100">
                        <Star className="w-4 h-4 text-pink-600 fill-pink-600" />
                        <span className="font-bold text-pink-600 text-sm">{profile.total_xp} XP</span>
                    </div>
                )}
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                    <Card className="border-0 shadow-sm bg-indigo-600 text-white rounded-3xl p-5 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs text-indigo-100 font-medium">Rank Kamu</p>
                            <h3 className="text-xl font-bold mt-1">{profile?.rank_title || 'Pemula'}</h3>
                            <Badge className="mt-2 bg-white/20 hover:bg-white/30 border-0">Level {profile?.current_level || 1}</Badge>
                        </div>
                        <Crown className="absolute -bottom-2 -right-2 w-20 h-20 text-white/10" />
                    </Card>
                    <Card className="border-0 shadow-sm bg-pink-600 text-white rounded-3xl p-5 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs text-pink-100 font-medium">Menang</p>
                            <h3 className="text-2xl font-bold mt-1">{profile?.games_won || 0}</h3>
                            <p className="text-[10px] mt-1">Total {profile?.games_played || 0} Game</p>
                        </div>
                        <TrendingUp className="absolute -bottom-2 -right-2 w-20 h-20 text-white/10" />
                    </Card>
                </div>

                <div className="space-y-4">
                    <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        Pilih Arena <Play className="w-4 h-4 text-pink-600" />
                    </h2>

                    <div className="grid grid-cols-1 gap-4">
                        {ARENA_MODES.map((arena) => (
                            <Card
                                key={arena.slug}
                                onClick={() => startPlaying(arena.slug)}
                                className="border-0 shadow-sm rounded-3xl active:scale-95 transition-transform cursor-pointer overflow-hidden group"
                            >
                                <CardContent className="p-0 flex">
                                    <div className={`w-28 flex items-center justify-center ${arena.color} text-white`}>
                                        <arena.icon className="w-10 h-10" />
                                    </div>
                                    <div className="flex-1 p-5 flex flex-col justify-center">
                                        <h3 className="font-bold text-gray-900">{arena.name}</h3>
                                        <p className="text-xs text-gray-500 mt-1">{arena.desc}</p>
                                        <div className="flex items-center gap-1 mt-3 text-pink-600 text-[10px] font-bold uppercase tracking-widest">
                                            Main Sekarang <ChevronRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        Top Learner Minggu Ini 🏆
                    </h2>
                    <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
                        <CardContent className="p-2">
                            {leaderboard.length === 0 ? (
                                <p className="text-center py-8 text-gray-400 text-sm">Belum ada data ranking.</p>
                            ) : (
                                leaderboard.map((leader, i) => (
                                    <div
                                        key={leader.user_id}
                                        className={`flex items-center gap-3 p-3 rounded-2xl ${i === 0 ? 'bg-yellow-50/50' : ''}`}
                                    >
                                        <div className="w-6 text-center font-black text-gray-400">
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                        </div>
                                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                            <AvatarImage src={leader.profiles?.avatar_url} />
                                            <AvatarFallback className="bg-gray-100 text-gray-500 text-sm font-bold">
                                                {leader.profiles?.full_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-gray-900 truncate">{leader.profiles?.full_name}</h4>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{leader.rank_title} • Lvl {leader.current_level}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-gray-900">{leader.total_xp}</p>
                                            <p className="text-[10px] text-pink-500 font-bold">XP</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            <BottomNav />
        </div>
    )
}
