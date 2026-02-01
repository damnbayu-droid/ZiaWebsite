'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Plus, Users, Hash, ArrowLeft } from 'lucide-react'

export default function ClassesPage() {
    const supabase = createClient()
    const [classes, setClasses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isJoinOpen, setIsJoinOpen] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const [joinCode, setJoinCode] = useState('')
    const [newClassName, setNewClassName] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchClasses()
    }, [])

    const fetchClasses = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch classes where user is member or owner
            // This view policy should already handle it.
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setClasses(data || [])
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!joinCode) return

        try {
            setSubmitting(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Find class by code
            const { data: classData, error: findError } = await supabase
                .from('classes')
                .select('id')
                .eq('code', joinCode)
                .single()

            if (findError || !classData) {
                alert('Kode kelas tidak valid')
                return
            }

            // Join
            const { error: joinError } = await supabase
                .from('class_members')
                .insert({
                    class_id: classData.id,
                    user_id: user.id,
                    role: 'student'
                })

            if (joinError) throw joinError

            setJoinCode('')
            setIsJoinOpen(false)
            fetchClasses()
            alert('Berhasil bergabung ke kelas!')
        } catch (error) {
            // if unique violation
            alert('Kamu sudah bergabung di kelas ini atau terjadi kesalahan.')
            console.error(error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newClassName) return

        try {
            setSubmitting(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const code = Math.random().toString(36).substring(2, 8).toUpperCase()

            const { error } = await supabase
                .from('classes')
                .insert({
                    owner_id: user.id,
                    name: newClassName,
                    code: code
                })

            if (error) throw error

            setNewClassName('')
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

    return (
        <div className="min-h-screen bg-gray-50 pb-24 safe-area-inset-bottom">
            <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">Kelas Saya</h1>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-full text-xs h-8">
                                Gabung
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-2xl">
                            <DialogHeader>
                                <DialogTitle>Gabung Kelas</DialogTitle>
                                <DialogDescription>Masukkan kode undangan dari gurumu.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleJoinClass} className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Kode Kelas</Label>
                                    <Input id="code" placeholder="Misal: ABC1234" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
                                </div>
                                <Button type="submit" disabled={submitting} className="w-full rounded-xl gradient-primary text-white">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gabung Sekarang'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="rounded-full h-8 w-8 p-0 bg-pink-500 hover:bg-pink-600">
                                <Plus className="w-5 h-5 text-white" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-2xl">
                            <DialogHeader>
                                <DialogTitle>Buat Kelas Baru</DialogTitle>
                                <DialogDescription>Buat ruang belajar bersama teman.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateClass} className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Kelas</Label>
                                    <Input id="name" placeholder="Misal: Kelompok Belajar Biologi" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                                </div>
                                <Button type="submit" disabled={submitting} className="w-full rounded-xl bg-pink-600 hover:bg-pink-700">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat Kelas'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {loading ? <p className="text-center text-sm text-gray-500">Memuat kelas...</p> :
                    classes.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Belum bergabung di kelas manapun.</p>
                        </div>
                    ) : (
                        classes.map(cls => (
                            <Card key={cls.id} className="border-0 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{cls.name}</h3>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 bg-gray-100 w-fit px-2 py-1 rounded-lg">
                                            <Hash className="w-3 h-3" />
                                            <span className="font-mono tracking-widest">{cls.code}</span>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Users className="w-5 h-5" />
                                    </div>
                                </div>
                            </Card>
                        ))
                    )
                }
            </main>
        </div>
    )
}
