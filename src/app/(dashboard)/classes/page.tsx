'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Plus, Users, ArrowLeft, Trash2, GraduationCap } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'

export default function ClassesPage() {
    const router = useRouter()
    const supabase = createClient()

    const [classes, setClasses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)

    const [newClassName, setNewClassName] = useState('')
    const [gradeLevel, setGradeLevel] = useState('')
    const [description, setDescription] = useState('')

    useEffect(() => {
        fetchClasses()
    }, [])

    const fetchClasses = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setCurrentUserId(user.id)

            // Check if admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            setIsAdmin(profile?.role === 'admin')

            // Fetch all classes
            const { data, error } = await supabase
                .from('classes')
                .select(`
                    *,
                    creator:created_by(full_name),
                    members:class_members(count)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setClasses(data || [])
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newClassName || !gradeLevel) {
            alert('Nama kelas dan tingkat harus diisi!')
            return
        }

        try {
            setSubmitting(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('classes')
                .insert({
                    name: newClassName,
                    grade_level: gradeLevel,
                    description: description || null,
                    created_by: user.id
                })

            if (error) throw error

            setNewClassName('')
            setGradeLevel('')
            setDescription('')
            setIsCreateOpen(false)
            fetchClasses()
            alert('Kelas berhasil dibuat!')
        } catch (error) {
            console.error(error)
            alert('Gagal membuat kelas')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteClass = async (classId: string, createdBy: string) => {
        if (!confirm('Yakin ingin menghapus kelas ini?')) return

        try {
            const { error } = await supabase
                .from('classes')
                .delete()
                .eq('id', classId)

            if (error) throw error

            fetchClasses()
            alert('Kelas berhasil dihapus!')
        } catch (error) {
            console.error(error)
            alert('Gagal menghapus kelas')
        }
    }

    const canDeleteClass = (createdBy: string) => {
        return isAdmin || createdBy === currentUserId
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 safe-area-inset-bottom">
            <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">Kelas</h1>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="rounded-full h-8 w-8 p-0 bg-pink-500 hover:bg-pink-600">
                            <Plus className="w-5 h-5 text-white" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>Buat Kelas Baru</DialogTitle>
                            <DialogDescription>Buat ruang belajar untuk siswa.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateClass} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Kelas *</Label>
                                <Input
                                    id="name"
                                    placeholder="Misal: IPA 1"
                                    value={newClassName}
                                    onChange={e => setNewClassName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="grade">Tingkat *</Label>
                                <Select value={gradeLevel} onValueChange={setGradeLevel} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih tingkat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="X">Kelas X</SelectItem>
                                        <SelectItem value="XI">Kelas XI</SelectItem>
                                        <SelectItem value="XII">Kelas XII</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc">Deskripsi (Opsional)</Label>
                                <Textarea
                                    id="desc"
                                    placeholder="Deskripsi kelas"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="min-h-[80px]"
                                />
                            </div>
                            <Button type="submit" disabled={submitting} className="w-full rounded-xl gradient-primary text-white">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat Kelas'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {/* Grade Level Sections */}
                {['X', 'XI', 'XII'].map(grade => {
                    const gradeClasses = classes.filter(c => c.grade_level === grade)
                    if (gradeClasses.length === 0) return null

                    return (
                        <div key={grade} className="space-y-3">
                            <div className="flex items-center gap-2 px-2">
                                <GraduationCap className="w-4 h-4 text-pink-600" />
                                <h2 className="font-bold text-sm text-gray-700 uppercase tracking-wider">Kelas {grade}</h2>
                            </div>
                            {gradeClasses.map(cls => (
                                <Link key={cls.id} href={`/classes/${cls.id}`}>
                                    <Card className="border-0 shadow-sm rounded-2xl p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900">{cls.name}</h3>
                                                {cls.description && (
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{cls.description}</p>
                                                )}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Users className="w-3 h-3" />
                                                        <span>{cls.members?.[0]?.count || 0} siswa</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400">
                                                        oleh {cls.creator?.full_name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                            {canDeleteClass(cls.created_by) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        handleDeleteClass(cls.id, cls.created_by)
                                                    }}
                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            )}
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )
                })}

                {loading && (
                    <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto" />
                    </div>
                )}

                {!loading && classes.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Belum ada kelas.</p>
                        <p className="text-sm mt-1">Klik tombol + untuk membuat kelas baru.</p>
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    )
}
