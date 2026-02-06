'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Bot, Send, Sparkles, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
        { role: 'ai', content: 'Halo! Aku Zia AI. Ada yang bisa kubantu tentang pelajaranmu hari ini?' }
    ])
    const [loading, setLoading] = useState(false)

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        const userMsg = query
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setQuery('')
        setLoading(true)

        // Simulate AI response
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    history: messages.slice(-5) // Send last 5 context messages
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get AI response')
            }

            setMessages(prev => [...prev, { role: 'ai', content: data.response }])
        } catch (error) {
            console.error('AI Error:', error)
            setMessages(prev => [...prev, { role: 'ai', content: "Maaf, aku sedang mengalami gangguan. Coba lagi nanti ya!" }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Card className="p-4 flex items-center gap-4 border-0 shadow-sm rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10" />
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">Tanya Zia AI</h3>
                        <p className="text-xs text-indigo-100 opacity-90">Bantuan belajar instan & pintar</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Sparkles className="w-4 h-4 fill-current" />
                    </div>
                </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-4 py-3 border-b bg-gray-50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-base">Zia AI Assistant</DialogTitle>
                            <DialogDescription className="text-xs">Online</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-4 bg-gray-50/50">
                    <div className="space-y-4">
                        {messages.length === 1 && (
                            <div className="grid grid-cols-1 gap-2 mb-2">
                                {[
                                    'Apa tugas tertunda saya?',
                                    'Ringkas catatan terakhirku',
                                    'Bantu aku jadwal belajar',
                                    'Cari materi Matematika'
                                ].map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => setQuery(prompt)}
                                        className="text-left px-4 py-3 bg-white border border-indigo-100 rounded-xl text-xs text-indigo-700 hover:bg-indigo-50 transition-colors shadow-sm flex items-center gap-2 group"
                                    >
                                        <Sparkles className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600" />
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1">
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-3 border-t bg-white safe-area-inset-bottom">
                    <form onSubmit={handleSend} className="relative">
                        <Input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Tanya tentang pelajaranmu..."
                            className="pr-12 rounded-full border-gray-200 bg-gray-50 focus:bg-white transition-colors h-11"
                        />
                        <Button type="submit" disabled={!query.trim() || loading} size="icon" className="absolute right-1 top-1 h-9 w-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Send className="w-4 h-4 ml-0.5" />
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
