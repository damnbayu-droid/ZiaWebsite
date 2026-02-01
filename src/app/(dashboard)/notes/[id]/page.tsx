'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Trash2, Calendar, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export default function NoteEditorPage() {
    const router = useRouter()
    const params = useParams()
    const supabase = createClient()
    const id = params.id === 'new' ? null : params.id

    const [loading, setLoading] = useState(!!id)
    const [saving, setSaving] = useState(false)

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [updatedAt, setUpdatedAt] = useState<string | null>(null)

    useEffect(() => {
        if (id) {
            fetchNote(id as string)
        }
    }, [id])

    const fetchNote = async (noteId: string) => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('id', noteId)
                .single()

            if (error) throw error
            if (data) {
                setTitle(data.title)
                setContent(data.content || '')
                setUpdatedAt(data.updated_at)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Gagal memuat catatan')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!title.trim()) return

        try {
            setSaving(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user')

            const noteData = {
                user_id: user.id,
                title,
                content,
                updated_at: new Date().toISOString()
            }

            if (id) {
                // Update
                const { error } = await supabase
                    .from('notes')
                    .update(noteData)
                    .eq('id', id)
                if (error) throw error
            } else {
                // Create
                const { error } = await supabase
                    .from('notes')
                    .insert(noteData)
                if (error) throw error
                router.push('/notes')
            }

            router.refresh()
            if (id) alert('Disimpan!')

        } catch (error) {
            console.error(error)
            alert('Gagal menyimpan')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!id || !confirm('Hapus catatan ini?')) return
        try {
            const { error } = await supabase.from('notes').delete().eq('id', id)
            if (error) throw error
            router.push('/notes')
        } catch (error) {
            console.error(error)
        }
    }

    if (loading) return <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-pink-500" /></div>

    return (
        <div className="min-h-screen bg-white flex flex-col safe-area-inset-bottom">
            {/* Header */}
            <header className="px-4 py-3 border-b flex items-center justify-between sticky top-0 bg-white z-10 safe-area-inset-top">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex items-center gap-2">
                    {id && (
                        <button onClick={handleDelete} className="p-2 rounded-full text-red-500 hover:bg-red-50">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                    <Button onClick={handleSave} disabled={saving} size="sm" className="bg-pink-600 hover:bg-pink-700 rounded-full px-4">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Simpan</>}
                    </Button>
                </div>
            </header>

            {/* Editor */}
            <main className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
                <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Judul Catatan..."
                    className="text-xl font-bold border-0 px-0 shadow-none focus-visible:ring-0 placeholder:text-gray-300"
                />

                <div className="text-xs text-gray-400 flex items-center gap-1 mb-4">
                    <Calendar className="w-3 h-3" />
                    {updatedAt ? format(new Date(updatedAt), 'dd MMMM yyyy, HH:mm', { locale: idLocale }) : 'Draft Baru'}
                </div>

                <Textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Mulai menulis..."
                    className="flex-1 resize-none border-0 px-0 shadow-none focus-visible:ring-0 text-base leading-relaxed text-gray-700 min-h-[300px]"
                />
            </main>
        </div>
    )
}
