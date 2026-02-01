'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, MessageSquare, Users } from 'lucide-react'

export default function ChatListPage() {
    const supabase = createClient()
    const [rooms, setRooms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRooms()
    }, [])

    const fetchRooms = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch private/group rooms and class rooms
            const { data, error } = await supabase
                .from('chat_rooms')
                .select('*')
                // Simple fetch, RLS will filter
                .order('created_at', { ascending: false })

            if (error) throw error
            setRooms(data || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 safe-area-inset-bottom">
            <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-900">Pesan</h1>
                <Button size="sm" className="rounded-full h-8 w-8 p-0 bg-pink-500 hover:bg-pink-600">
                    <Plus className="w-5 h-5 text-white" />
                </Button>
            </header>

            <main className="max-w-lg mx-auto px-4 py-4 space-y-2">
                {loading ? <p className="text-center text-gray-500 py-10">Memuat pesan...</p> :
                    rooms.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Belum ada percakapan.</p>
                        </div>
                    ) : (
                        rooms.map(room => (
                            <Link key={room.id} href={`/chat/${room.id}`}>
                                <div className="flex items-center gap-3 p-3 bg-white hover:bg-gray-50 rounded-xl transition-colors border-b last:border-0 border-gray-100">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src="" />
                                        <AvatarFallback className="bg-blue-100 text-blue-600">
                                            {room.type === 'class' || room.type === 'group' ? <Users className="w-5 h-5" /> : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{room.name || 'Percakapan Pribadi'}</h3>
                                        <p className="text-xs text-gray-500 truncate">Ketuk untuk membuka obrolan</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400">10m</span>
                                </div>
                            </Link>
                        ))
                    )
                }
            </main>
        </div>
    )
}
