'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Send, Paperclip, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function ChatRoomPage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const roomId = params.id as string
    const scrollRef = useRef<HTMLDivElement>(null)

    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)

    useEffect(() => {
        getCurrentUser()
        const channel = supabase
            .channel('chat_room')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_room_id=eq.${roomId}` }, (payload) => {
                setMessages((current) => [...current, payload.new])
                scrollToBottom()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId])

    useEffect(() => {
        if (currentUser) {
            fetchMessages()
        }
    }, [currentUser])

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)
    }

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_room_id', roomId)
            .order('created_at', { ascending: true })

        setMessages(data || [])
        scrollToBottom()
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !currentUser) return

        try {
            setSending(true)
            const msg = {
                chat_room_id: roomId,
                sender_id: currentUser.id,
                content: newMessage,
                created_at: new Date().toISOString() // Optimistic
            }

            // Optimistic update
            setMessages((prev) => [...prev, msg])
            setNewMessage('')
            scrollToBottom()

            const { error } = await supabase.from('messages').insert({
                chat_room_id: roomId,
                sender_id: currentUser.id,
                content: msg.content
            })

            if (error) throw error

        } catch (error) {
            console.error(error)
            alert('Gagal mengirim pesan')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 safe-area-inset-bottom">
            <header className="bg-white px-4 py-3 sticky top-0 z-10 safe-area-inset-top shadow-sm flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-pink-100 text-pink-600 font-bold">C</AvatarFallback>
                    </Avatar>
                    <h1 className="font-bold text-gray-900">Chat Room</h1>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => {
                    const isMe = msg.sender_id === currentUser?.id
                    return (
                        <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-pink-500 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm'}`}>
                                {msg.content}
                            </div>
                        </div>
                    )
                })}
                <div ref={scrollRef} />
            </div>

            <div className="p-3 bg-white border-t safe-area-inset-bottom">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <Button type="button" size="icon" variant="ghost" className="text-gray-400">
                        <Paperclip className="w-5 h-5" />
                    </Button>
                    <Input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Tulis pesan..."
                        className="rounded-full bg-gray-50 border-transparent focus:bg-white transition-colors"
                    />
                    <Button type="submit" disabled={sending || !newMessage.trim()} size="icon" className="rounded-full bg-pink-500 hover:bg-pink-600 text-white">
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
