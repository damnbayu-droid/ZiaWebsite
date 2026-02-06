'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Mic, Square, Save, Loader2, Play, Pause, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

export function AudioRecorder({ onSave }: { onSave?: () => void }) {
    const router = useRouter()
    const [isRecording, setIsRecording] = useState(false)
    const [duration, setDuration] = useState(0)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [title, setTitle] = useState('')
    const [uploading, setUploading] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [saveAsNote, setSaveAsNote] = useState(true)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const chunksRef = useRef<BlobPart[]>([])
    const recognitionRef = useRef<any>(null)

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            // Speech Recognition Setup
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition()
                recognition.continuous = true
                recognition.interimResults = true
                recognition.lang = 'id-ID' // Indonesian

                recognition.onresult = (event: any) => {
                    let finalTranscript = ''
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript
                        }
                    }
                    if (finalTranscript) {
                        setTranscript(prev => prev + ' ' + finalTranscript)
                    }
                }

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error)
                }

                recognition.start()
                recognitionRef.current = recognition
            }

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                setAudioBlob(blob)
                setShowSaveDialog(true)
                chunksRef.current = []
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            setDuration(0)
            setTranscript('')
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1)
            }, 1000)

        } catch (err) {
            console.error('Error accessing microphone:', err)
            alert('Izin mikrofon diperlukan untuk merekam.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) clearInterval(timerRef.current)
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
        }
    }

    const handleSave = async () => {
        if (!audioBlob || !title.trim()) return

        try {
            setUploading(true)
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const fileName = `${user.id}/${Date.now()}.webm`
            const { error: uploadError } = await supabase.storage
                .from('recordings')
                .upload(fileName, audioBlob)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('recordings')
                .getPublicUrl(fileName)

            const { error: dbError } = await supabase.from('recordings').insert({
                user_id: user.id,
                title: title,
                file_url: publicUrl,
                duration: duration
            })

            if (dbError) throw dbError

            // Save as Note if requested
            if (saveAsNote && transcript.trim()) {
                await supabase.from('notes').insert({
                    user_id: user.id,
                    title: `Transkrip: ${title}`,
                    content: transcript,
                })
            }

            alert('Rekaman disimpan!')
            setAudioBlob(null)
            setShowSaveDialog(false)
            setTitle('')
            setDuration(0)
            setTranscript('')
            if (onSave) onSave()

        } catch (error) {
            console.error(error)
            alert('Gagal menyimpan rekaman.')
        } finally {
            setUploading(false)
        }
    }

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60)
        const sec = seconds % 60
        return `${min}:${sec.toString().padStart(2, '0')}`
    }

    return (
        <>
            <div className="flex flex-col items-center gap-4 p-4 border rounded-2xl bg-white shadow-sm">
                <div className="text-3xl font-mono text-gray-700 font-bold">
                    {formatTime(duration)}
                </div>
                {isRecording ? (
                    <Button onClick={stopRecording} size="lg" className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600 shadow-lg animate-pulse">
                        <Square className="w-6 h-6 fill-white" />
                    </Button>
                ) : (
                    <Button onClick={startRecording} size="lg" className="rounded-full h-16 w-16 bg-pink-500 hover:bg-pink-600 shadow-lg">
                        <Mic className="w-8 h-8" />
                    </Button>
                )}
                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        {isRecording ? 'Sedang merekam & mentranskripsi...' : 'Ketuk untuk merekam'}
                    </p>
                    {transcript && !isRecording && (
                        <p className="text-[10px] text-gray-400 mt-2 line-clamp-1 italic">"{transcript}"</p>
                    )}
                </div>
            </div>

            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent className="sm:max-max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Simpan Rekaman</DialogTitle>
                        <DialogDescription>Beri nama untuk rekaman suara ini.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                            <span className="text-sm font-medium">Durasi</span>
                            <span className="font-mono text-gray-600">{formatTime(duration)}</span>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">Judul Rekaman</Label>
                            <Input id="title" placeholder="Contoh: Penjelasan Rumus Fisika" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>

                        {transcript && (
                            <div className="space-y-3">
                                <Label>Hasil Transkrip (STT)</Label>
                                <div className="p-3 bg-pink-50/50 border border-pink-100 rounded-xl text-xs text-gray-600 max-h-32 overflow-y-auto leading-relaxed">
                                    {transcript}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="saveNote" checked={saveAsNote} onCheckedChange={(val) => setSaveAsNote(!!val)} />
                                    <label htmlFor="saveNote" className="text-xs font-medium text-gray-600 cursor-pointer">
                                        Simpan hasil transkrip sebagai Catatan
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button onClick={() => setShowSaveDialog(false)} variant="outline" className="rounded-xl flex-1">Batal</Button>
                        <Button onClick={handleSave} disabled={uploading} className="rounded-xl gradient-primary text-white flex-1">
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
