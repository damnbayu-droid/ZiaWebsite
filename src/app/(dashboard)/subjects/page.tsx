'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Plus, Book, MoreVertical, Trash2, Edit2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { BottomNav } from '@/components/BottomNav'

export interface Subject {
    id: string
    name: string
    color: string
    icon: string
    created_at: string
}

export default function SubjectsPage() {
    const supabase = createClient()
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [color, setColor] = useState('#db2777')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchSubjects()
    }, [])

    const fetchSubjects = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('subjects')
                .select('*, notes(count)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setSubjects(data || [])
        } catch (error) {
            console.error('Error fetching subjects:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateSubject = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        try {
            setSubmitting(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user')

            const { error } = await supabase.from('subjects').insert({
                user_id: user.id,
                name: name,
                color: color,
                icon: 'book' // Default for now
            })

            if (error) throw error

            setName('')
            setIsDialogOpen(false)
            fetchSubjects()
        } catch (error) {
            alert('Gagal membuat mata pelajaran')
            console.error(error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteSubject = async (id: string) => {
        if (!confirm('Hapus mata pelajaran ini? Semua catatan di dalamnya juga akan terhapus.')) return

        try {
            const { error } = await supabase.from('subjects').delete().eq('id', id)
            if (error) throw error
            setSubjects(subjects.filter(s => s.id !== id))
        } catch (error) {
            alert('Gagal menghapus mata pelajaran')
            console.error(error)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 safe-area-inset-bottom">
            <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-900">Mata Pelajaran</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="rounded-full h-8 w-8 p-0 bg-pink-500 hover:bg-pink-600">
                            <Plus className="w-5 h-5 text-white" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>Mata Pelajaran Baru</DialogTitle>
                            <DialogDescription>Tambahkan mata pelajaran yang ingin kamu pelajari.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateSubject} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Mata Pelajaran</Label>
                                <Input
                                    id="name"
                                    placeholder="Contoh: Matematika"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="color">Warna Label</Label>
                                <div className="flex gap-2">
                                    {['#db2777', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-95 ${color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={submitting} className="w-full rounded-xl bg-pink-600 hover:bg-pink-700">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat Sekarang'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <Book className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Belum ada mata pelajaran.</p>
                        <p className="text-xs">Tekan + untuk menambahkan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {subjects.map((subject) => (
                            <Card key={subject.id} className="border-0 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow relative group">
                                <Link href={`/subjects/${subject.id}`} className="block p-5 h-full">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-white shadow-sm" style={{ backgroundColor: subject.color }}>
                                        <Book className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight">{subject.name}</h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {(subject as any).notes?.[0]?.count || 0} Catatan
                                    </p>
                                </Link>
                                <div className="absolute top-2 right-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-1 rounded-full text-gray-400 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteSubject(subject.id)}>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Hapus
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    )
}
