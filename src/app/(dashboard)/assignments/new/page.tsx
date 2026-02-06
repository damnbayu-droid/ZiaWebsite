'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft, Plus } from 'lucide-react'

export default function NewAssignmentPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [subjects, setSubjects] = useState<any[]>([])

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [subjectId, setSubjectId] = useState('')

    useEffect(() => {
        fetchSubjects()
    }, [])

    const fetchSubjects = async () => {
        const { data } = await supabase
            .from('subjects')
            .select('*')
            .order('name')

        setSubjects(data || [])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            alert('Judul tugas harus diisi!')
            return
        }

        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                alert('Anda harus login terlebih dahulu!')
                return
            }

            const { error } = await supabase
                .from('assignments')
                .insert({
                    title: title.trim(),
                    description: description.trim() || null,
                    due_date: dueDate || null,
                    subject_id: subjectId || null,
                    user_id: user.id,
                    status: 'open'
                })

            if (error) {
                console.error('Insert error:', error)
                throw error
            }

            alert('Tugas berhasil ditambahkan!')
            router.push('/assignments')
        } catch (error: any) {
            alert(`Gagal menambahkan tugas: ${error.message}`)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 safe-area-inset-bottom">
            {/* Header */}
            <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm flex items-center justify-between">
                <Link href="/assignments" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </Link>
                <h1 className="text-lg font-bold text-gray-900">Tugas Baru</h1>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <main className="max-w-lg mx-auto px-4 py-6">
                <Card className="border-0 shadow-sm rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg">Tambah Tugas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Judul Tugas *</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Contoh: PR Matematika Bab 5"
                                    className="h-11 rounded-xl"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Mata Pelajaran</Label>
                                <Select value={subjectId} onValueChange={setSubjectId}>
                                    <SelectTrigger className="h-11 rounded-xl">
                                        <SelectValue placeholder="Pilih mata pelajaran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.map((subject) => (
                                            <SelectItem key={subject.id} value={subject.id}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: subject.color }}
                                                    />
                                                    {subject.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Tenggat Waktu</Label>
                                <Input
                                    id="dueDate"
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="h-11 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Detail tugas (opsional)"
                                    className="rounded-xl min-h-[100px]"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 rounded-xl gradient-primary text-white"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Menyimpan...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Tambah Tugas
                                    </span>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
