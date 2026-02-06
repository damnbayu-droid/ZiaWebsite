'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bot, Send, Sparkles, X, MessageCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'

export default function AIBubble() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
        { role: 'ai', content: 'Halo! Aku Zia AI. Ada yang bisa kubantu belajar hari ini?' }
    ])
    const [loading, setLoading] = useState(false)

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        const userMsg = query
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setQuery('')
        setLoading(true)

        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    history: messages.slice(-5)
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error)

            setMessages(prev => [...prev, { role: 'ai', content: data.response }])
        } catch (error) {
            console.error('AI Error:', error)
            setMessages(prev => [...prev, { role: 'ai', content: "Maaf, Zia sedang istirahat sejenak. Coba lagi nanti ya!" }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full gradient-primary text-white shadow-lg flex items-center justify-center border-4 border-white"
                        aria-label="Buka Zia AI Smart Assistant"
                    >
                        <Bot className="w-7 h-7" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                    </motion.button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl h-[70vh] flex flex-col p-0 overflow-hidden shadow-2xl border-0">
                    <DialogHeader className="px-4 py-3 border-b bg-gradient-to-r from-pink-500 to-rose-500 text-white flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-bold">Zia AI Smart Assistant</DialogTitle>
                                <DialogDescription className="text-[10px] text-pink-100">Siap bantu kamu lulus ujian!</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="flex-1 p-4 bg-gray-50/50">
                        <div className="space-y-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-pink-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-100 px-3 py-2 rounded-2xl rounded-tl-sm shadow-sm flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-3 border-t bg-white">
                        <form onSubmit={handleSend} className="relative">
                            <Input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Tanyakan apa saja..."
                                className="pr-12 rounded-xl border-gray-100 bg-gray-50 focus:bg-white transition-colors h-10 text-xs"
                            />
                            <Button type="submit" disabled={!query.trim() || loading} size="icon" className="absolute right-1 top-1 h-8 w-8 rounded-lg bg-pink-600 hover:bg-pink-700 text-white">
                                <Send className="w-3.5 h-3.5" />
                            </Button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
