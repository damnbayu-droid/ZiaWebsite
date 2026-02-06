'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, ArrowLeft, Send, Phone, Video, MessageSquare } from 'lucide-react'

export default function ChatPage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const scrollRef = useRef<HTMLDivElement>(null)

    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [receiver, setReceiver] = useState<any>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [sending, setSending] = useState(false)

    useEffect(() => {
        fetchChatData()
        subscribeToMessages()
    }, [params.id])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }

    const fetchChatData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setCurrentUser(user)

            // Get receiver info
            const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', params.id)
                .single()
            setReceiver(prof)

            // Get messages
            const { data: msgs } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${params.id}),and(sender_id.eq.${params.id},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: true })

            setMessages(msgs || [])
        } catch (error) {
            console.error('Error fetching chat:', error)
        } finally {
            setLoading(false)
        }
    }

    const subscribeToMessages = () => {
        const channel = supabase
            .channel('realtime-messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, (payload) => {
                const newMsg = payload.new
                if (
                    (newMsg.sender_id === currentUser?.id && newMsg.receiver_id === params.id) ||
                    (newMsg.sender_id === params.id && newMsg.receiver_id === currentUser?.id)
                ) {
                    setMessages(prev => [...prev, newMsg])
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !currentUser) return

        try {
            setSending(true)
            const msgContent = newMessage.trim()
            setNewMessage('')

            const { error } = await supabase
                .from('messages')
                .insert({
                    sender_id: currentUser.id,
                    receiver_id: params.id,
                    content: msgContent
                })

            if (error) throw error
        } catch (error) {
            console.error('Failed to send message:', error)
            alert('Gagal mengirim pesan')
        } finally {
            setSending(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
    )

    return (
        <div className="flex flex-col h-screen bg-gray-50 max-w-lg mx-auto shadow-2xl">
            {/* Header */}
            <header className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100 safe-area-inset-top">
                <button onClick={() => router.back()} className="p-1 -ml-1 text-gray-600">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex-1 flex items-center gap-3">
                    <Avatar className="w-10 h-10 border border-gray-100">
                        <AvatarImage src={receiver?.avatar_url || ''} />
                        <AvatarFallback className="bg-pink-100 text-pink-600 font-bold">
                            {receiver?.full_name?.[0]?.toUpperCase() || 'S'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <h2 className="font-bold text-gray-900 truncate">{receiver?.full_name}</h2>
                        <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</p>
                    </div>
                </div>
                <div className="flex gap-2 text-gray-400">
                    <Button variant="ghost" size="icon" className="rounded-full w-8 h-8"><Phone className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-full w-8 h-8"><Video className="w-4 h-4" /></Button>
                </div>
            </header>

            {/* Chat Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center">
                            <MessageSquare className="w-10 h-10 text-pink-200" />
                        </div>
                        <p className="text-sm text-gray-400">Mulai percakapan dengan {receiver?.full_name}. Kirim sapaan pertamamu!</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMine = msg.sender_id === currentUser?.id
                        return (
                            <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                                    max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm
                                    ${isMine ? 'bg-pink-500 text-white rounded-tr-none shadow-pink-100' : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'}
                                `}>
                                    <p className="leading-relaxed">{msg.content}</p>
                                    <p className={`text-[9px] mt-1 ${isMine ? 'text-pink-100 text-right' : 'text-gray-400 text-left'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 safe-area-inset-bottom">
                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <Input
                        placeholder="Ketik pesan..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 h-12 rounded-2xl bg-gray-50 border-0 focus-visible:ring-pink-500"
                    />
                    <Button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="h-12 w-12 rounded-2xl gradient-primary text-white p-0 flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
