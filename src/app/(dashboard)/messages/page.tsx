'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, MessageSquare, Search, ArrowLeft, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function MessagesPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<any[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get current user profile for grade
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            setCurrentUser(profile)

            if (profile && profile.grade) {
                // Fetch users in the same grade, excluding self and admins
                const { data: peers } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('grade', profile.grade)
                    .neq('id', user.id)
                    .neq('role', 'admin') // Hidden Admin

                setUsers(peers || [])
            }
        } catch (error) {
            console.error('Error fetching social data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50 pb-24 safe-area-inset-bottom">
            <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">Pesan & Teman</h1>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Cari teman seangkatan..."
                        className="pl-10 h-12 rounded-2xl bg-white border-0 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-1">
                            Teman Kelas {currentUser?.grade || ''}
                        </h2>
                        <span className="text-[10px] bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full font-bold">
                            {users.length} Siswa
                        </span>
                    </div>

                    {loading ? (
                        <div className="py-20 flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                            <p className="text-sm text-gray-400">Mencari teman...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="py-20 text-center space-y-3">
                            <Users className="w-12 h-12 mx-auto text-gray-200" />
                            <p className="text-gray-400">Tidak ada teman yang ditemukan.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {filteredUsers.map((peer) => (
                                <Link key={peer.id} href={`/messages/${peer.id}`}>
                                    <Card className="border-0 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow active:scale-[0.98]">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                                <AvatarImage src={peer.avatar_url || ''} />
                                                <AvatarFallback className="bg-pink-100 text-pink-600 font-bold">
                                                    {peer.full_name?.[0]?.toUpperCase() || 'S'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate">{peer.full_name}</h3>
                                                <p className="text-xs text-gray-400 truncate">{peer.school || 'SMAN 1 Kotabunan'}</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
                                                <MessageSquare className="w-4 h-4" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
