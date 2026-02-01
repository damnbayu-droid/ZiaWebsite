'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, UserPlus, Trash2, Search, QrCode, ShieldAlert, CheckCircle, Settings as SettingsIcon, Camera } from 'lucide-react'
import { format } from 'date-fns'

interface Student {
    id: string
    full_name: string
    grade: string
    avatar_url: string
    role: string
    identity?: {
        public_token: string
        is_active: boolean
        expires_at: string
    } | null
}

export default function AdminPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [students, setStudents] = useState<Student[]>([])
    const [search, setSearch] = useState('')
    const [processing, setProcessing] = useState<string | null>(null) // ID of student being processed

    useEffect(() => {
        fetchStudents()
    }, [])

    const fetchStudents = async () => {
        try {
            setLoading(true)
            // Fetch profiles + identity
            // Note: This requires RLS policy to allow Admin to see all profiles.
            // Ensure 'profiles' RLS allows select for admin.
            // Or use an RPC function if RLS is strict "view own only".
            // For now, I'll attempt direct query assuming "Public profiles viewable by everyone in same class" or similar, or I need to fix RLS.
            // Let's assume fetching profiles works or I'll handle error.

            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    identity:student_identity(public_token, is_active, expires_at)
                `)
                // Removed .neq('role', 'admin') so Admin can see themselves for testing
                .order('full_name')

            if (error) throw error

            // Transform data: student_identity is simplified to single object or null
            const formatted = data.map((s: any) => ({
                ...s,
                identity: Array.isArray(s.identity) && s.identity.length > 0 ? s.identity[0] : null
            }))

            setStudents(formatted)
        } catch (e) {
            console.error(e)
            // If fetch fails, it might be RLS.
            // Admin page should really use Service Role if client-side is restricted?
            // No, Client-side admin should work if RLS allows it based on user Role.
        } finally {
            setLoading(false)
        }
    }

    const generateIdentity = async (studentId: string) => {
        try {
            setProcessing(studentId)
            // 1. Get School ID (Mock/Single)
            const { data: schools } = await supabase.from('schools').select('id').limit(1)
            const schoolId = schools?.[0]?.id

            if (!schoolId) {
                alert('School ID not found. Run setup SQL.')
                return
            }

            const token = crypto.randomUUID().split('-')[0].toUpperCase()

            const { error } = await supabase.from('student_identity').insert({
                user_id: studentId,
                school_id: schoolId,
                public_token: token,
                activated_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
                is_active: true
            })

            if (error) throw error
            await fetchStudents() // Refresh

        } catch (e) {
            alert('Gagal generate identity')
            console.error(e)
        } finally {
            setProcessing(null)
        }
    }

    const revokeIdentity = async (studentId: string) => {
        if (!confirm('Yakin ingin mencabut identitas siswa ini?')) return
        try {
            setProcessing(studentId)
            const { error } = await supabase
                .from('student_identity')
                .update({ is_active: false })
                .eq('user_id', studentId)

            if (error) throw error
            await fetchStudents()
        } catch (e) {
            alert('Gagal revoke identity')
        } finally {
            setProcessing(null)
        }
    }

    const [editingStudent, setEditingStudent] = useState<Student | null>(null)

    const handleUpdateStudent = async () => {
        if (!editingStudent) return
        try {
            setProcessing('save')
            const { error } = await supabase.from('profiles').update({
                full_name: editingStudent.full_name,
                grade: editingStudent.grade,
                avatar_url: editingStudent.avatar_url
            }).eq('id', editingStudent.id)

            if (error) throw error
            await fetchStudents()
            setEditingStudent(null)
            alert('Data siswa berhasil diperbarui')
        } catch (e) {
            console.error(e)
            alert('Gagal update siswa')
        } finally {
            setProcessing(null)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingStudent || !e.target.files || !e.target.files[0]) return
        try {
            setProcessing('upload')
            const file = e.target.files[0]
            const fileExt = file.name.split('.').pop()
            const filePath = `${editingStudent.id}/${Math.random()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setEditingStudent({ ...editingStudent, avatar_url: publicUrl })
        } catch (error: any) {
            console.error(error)
            alert(`Gagal upload foto: ${error.message || error}`)
        } finally {
            setProcessing(null)
        }
    }

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.grade?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Manajemen Siswa</h2>
                    <p className="text-gray-500">Kelola identitas digital dan akses siswa.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Card className="px-4 py-2 bg-white border shadow-sm flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                            <p className="text-xs text-gray-500">Aktif</p>
                            <p className="font-bold">{students.filter(s => s.identity?.is_active).length}</p>
                        </div>
                    </Card>
                    <Card className="px-4 py-2 bg-white border shadow-sm flex items-center gap-3">
                        <UserPlus className="w-5 h-5 text-blue-500" />
                        <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="font-bold">{students.length}</p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="Cari siswa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-white"
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map(student => (
                    <Card key={student.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                            <div className="flex items-center gap-4 p-4">
                                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={student.avatar_url || '/placeholder-user.jpg'} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 line-clamp-1">{student.full_name}</h3>
                                    <p className="text-sm text-gray-500">{student.grade || 'No Grade'}</p>
                                </div>
                            </div>

                            <div className="border-t bg-gray-50/50 p-3 flex items-center justify-between">
                                <div>
                                    {student.identity ? (
                                        student.identity.is_active ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                                                ID Aktif
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-0">
                                                Revoked
                                            </Badge>
                                        )
                                    ) : (
                                        <Badge variant="secondary" className="bg-gray-100 text-gray-500">Belum Ada ID</Badge>
                                    )}
                                </div>

                                {student.identity?.is_active ? (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-600 hover:bg-red-50 hover:text-red-700 h-8 w-8 p-0"
                                        onClick={() => revokeIdentity(student.id)}
                                        disabled={processing === student.id}
                                    >
                                        {processing === student.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                        onClick={() => generateIdentity(student.id)}
                                        disabled={processing === student.id}
                                    >
                                        {processing === student.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate ID'}
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 ml-1 text-gray-500 hover:text-gray-900"
                                    onClick={() => setEditingStudent(student)}
                                >
                                    <SettingsIcon className="w-4 h-4" />
                                </Button>
                            </div>

                            {student.identity?.is_active && (
                                <div className="px-4 pb-4 pt-1">
                                    <p className="text-[10px] text-gray-400 font-mono">
                                        Token: {student.identity.public_token}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
            {/* Edit Dialog */}
            <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Siswa</DialogTitle>
                        <DialogDescription>Perbarui data profil dan foto siswa.</DialogDescription>
                    </DialogHeader>
                    {editingStudent && (
                        <div className="space-y-4 py-2">
                            <div className="flex justify-center mb-4">
                                <div className="relative group w-24 h-24">
                                    <Avatar className="w-24 h-24 border-2 border-gray-100">
                                        <AvatarImage src={editingStudent.avatar_url || ''} />
                                        <AvatarFallback>{editingStudent.full_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <label htmlFor="edit-avatar" className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                                        <Camera className="w-6 h-6" />
                                    </label>
                                    <input
                                        type="file"
                                        id="edit-avatar"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        disabled={processing === 'upload'}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Nama Lengkap</Label>
                                <Input
                                    value={editingStudent.full_name}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Kelas</Label>
                                <Input
                                    value={editingStudent.grade || ''}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, grade: e.target.value })}
                                />
                            </div>
                            <Button
                                className="w-full mt-4 bg-pink-600 hover:bg-pink-700"
                                onClick={handleUpdateStudent}
                                disabled={processing === 'save'}
                            >
                                {processing === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Perubahan'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
