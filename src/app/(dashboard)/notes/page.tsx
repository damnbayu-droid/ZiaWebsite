'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Search, FileText, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export default function NotesPage() {
    const supabase = createClient()
    const [notes, setNotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchNotes()
    }, [])

    const fetchNotes = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('notes')
                .select(`
          id, title, content, created_at, updated_at,
          subjects ( name, color )
        `)
                .order('updated_at', { ascending: false })

            if (error) throw error
            setNotes(data || [])
        } catch (error) {
            console.error('Error fetching notes:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.content?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50 pb-24 safe-area-inset-bottom">
            <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-bold text-gray-900">Catatan Saya</h1>
                    <Link href="/notes/new">
                        <Button size="sm" className="rounded-full h-8 w-8 p-0 bg-pink-500 hover:bg-pink-600">
                            <Plus className="w-5 h-5 text-white" />
                        </Button>
                    </Link>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Cari catatan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10 rounded-xl bg-gray-50 border-gray-200"
                    />
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {loading ? (
                    <p className="text-center text-sm text-gray-400 py-10">Memuat catatan...</p>
                ) : filteredNotes.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Belum ada catatan.</p>
                    </div>
                ) : (
                    filteredNotes.map((note) => (
                        <Link key={note.id} href={`/notes/${note.id}`}>
                            <Card className="border-0 shadow-sm rounded-2xl p-4 hover:shadow-md transition-shadow active:scale-[0.99]">
                                <div className="flex justify-between items-start mb-2">
                                    <span
                                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                        style={{
                                            backgroundColor: note.subjects?.color ? `${note.subjects.color}20` : '#f3f4f6',
                                            color: note.subjects?.color || '#6b7280'
                                        }}
                                    >
                                        {note.subjects?.name || 'Umum'}
                                    </span>
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(note.updated_at), 'dd MMM', { locale: idLocale })}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">{note.title}</h3>
                                <p className="text-xs text-gray-500 line-clamp-2">{note.content}</p>
                            </Card>
                        </Link>
                    ))
                )}
            </main>
        </div>
    )
}
