'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Play, Pause, Trash2, Mic } from 'lucide-react'
import { AudioRecorder } from '@/components/AudioRecorder'

export default function RecordingsPage() {
    const supabase = createClient()
    const [recordings, setRecordings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [playingId, setPlayingId] = useState<string | null>(null)
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

    useEffect(() => {
        fetchRecordings()
        return () => {
            if (audio) audio.pause()
        }
    }, []) // eslint-disable-next-line react-hooks/exhaustive-deps

    const fetchRecordings = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('recordings')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setRecordings(data || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const togglePlay = (url: string, id: string) => {
        if (playingId === id) {
            audio?.pause()
            setPlayingId(null)
        } else {
            if (audio) audio.pause()
            const newAudio = new Audio(url)
            newAudio.onended = () => setPlayingId(null)
            newAudio.play()
            setAudio(newAudio)
            setPlayingId(id)
        }
    }

    const handleDelete = async (id: string, path: string) => {
        if (!confirm('Hapus rekaman ini?')) return
        try {
            // Ideally delete from storage too, but simple DB delete is MVP
            await supabase.from('recordings').delete().eq('id', id)
            setRecordings(p => p.filter(r => r.id !== id))
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 safe-area-inset-bottom">
            <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm">
                <h1 className="text-lg font-bold text-gray-900">Rekaman Suara</h1>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
                <AudioRecorder onSave={fetchRecordings} />

                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-gray-700">Daftar Rekaman</h2>
                    {loading ? <p className="text-center text-gray-500">Memuat...</p> :
                        recordings.length === 0 ? <p className="text-center text-gray-500 text-sm">Belum ada rekaman.</p> :
                            recordings.map(rec => (
                                <Card key={rec.id} className="p-4 flex items-center gap-3 border-0 shadow-sm rounded-2xl">
                                    <button
                                        onClick={() => togglePlay(rec.file_url, rec.id)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${playingId === rec.id ? 'bg-pink-600' : 'bg-pink-400'}`}
                                    >
                                        {playingId === rec.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold truncate">{rec.title}</h3>
                                        <p className="text-xs text-gray-500">{Math.floor(rec.duration / 60)}:{(rec.duration % 60).toString().padStart(2, '0')}</p>
                                    </div>
                                    <button onClick={() => handleDelete(rec.id, rec.file_url)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </Card>
                            ))
                    }
                </div>
            </main>
        </div>
    )
}
