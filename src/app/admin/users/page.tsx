'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, UserPlus, CheckCircle, Search, QrCode, Edit, MessageSquare, Activity as ActivityIcon, Trash2, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'

interface Student {
    id: string
    full_name: string
    grade: string
    school: string
    avatar_url: string
    email?: string
    is_verified: boolean
    identity?: {
        public_token: string
        student_number: string | null
        is_active: boolean
        expires_at: string
    } | null
}

export default function UserManagementPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [students, setStudents] = useState<Student[]>([])
    const [search, setSearch] = useState('')
    const [processing, setProcessing] = useState<string | null>(null)

    // Dialogs
    const [barcodeStudent, setBarcodeStudent] = useState<Student | null>(null)
    const [nisStudent, setNisStudent] = useState<Student | null>(null)
    const [nisValue, setNisValue] = useState('')
    const [activityStudent, setActivityStudent] = useState<Student | null>(null)
    const [activities, setActivities] = useState<any[]>([])
    const [deleteStudent, setDeleteStudent] = useState<Student | null>(null)

    useEffect(() => {
        fetchStudents()
    }, [])

    const fetchStudents = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    identity:student_identity(public_token, student_number, is_active, expires_at)
                `)
                .order('full_name')

            if (error) throw error

            const formatted = data.map((s: any) => ({
                ...s,
                identity: Array.isArray(s.identity) && s.identity.length > 0 ? s.identity[0] : null
            }))

            setStudents(formatted)
        } catch (e: any) {
            console.error('Error fetching students:', e.message || e)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateNIS = async () => {
        if (!nisStudent) return
        try {
            setProcessing('nis')

            // Check if identity exists
            if (!nisStudent.identity) {
                alert('User belum memiliki student identity')
                return
            }

            const { error } = await supabase
                .from('student_identity')
                .update({ student_number: nisValue })
                .eq('user_id', nisStudent.id)

            if (error) throw error

            await fetchStudents()
            setNisStudent(null)
            setNisValue('')
            alert('NIS berhasil diperbarui')
        } catch (e) {
            console.error(e)
            alert('Gagal update NIS')
        } finally {
            setProcessing(null)
        }
    }

    const fetchUserActivity = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('activity_logs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20)

            setActivities(data || [])
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeleteUser = async () => {
        if (!deleteStudent) return
        try {
            setProcessing('delete')

            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', deleteStudent.id)

            if (error) throw error

            await fetchStudents()
            setDeleteStudent(null)
            alert('User berhasil dihapus')
        } catch (e) {
            console.error(e)
            alert('Gagal menghapus user')
        } finally {
            setProcessing(null)
        }
    }

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
                    <p className="text-gray-500">Kelola pengguna, barcode, NIS, dan aktivitas.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Card className="px-4 py-2 bg-white border shadow-sm flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                            <p className="text-xs text-gray-500">Verified</p>
                            <p className="font-bold">{students.filter(s => s.is_verified).length}</p>
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
                    placeholder="Cari user (nama, email)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-white"
                />
            </div>

            {/* User Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={student.avatar_url} />
                                                    <AvatarFallback>{student.full_name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-gray-900">{student.full_name}</p>
                                                    <p className="text-xs text-gray-500">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{student.grade || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-sm">
                                                {student.identity?.student_number || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {student.is_verified ? (
                                                <Badge className="bg-green-100 text-green-700 border-0">Verified</Badge>
                                            ) : (
                                                <Badge variant="secondary">Pending</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => setBarcodeStudent(student)}
                                                    title="View Barcode"
                                                >
                                                    <QrCode className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        setNisStudent(student)
                                                        setNisValue(student.identity?.student_number || '')
                                                    }}
                                                    title="Edit NIS"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Link href={`/messages?user=${student.id}`}>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                        title="Message User"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        setActivityStudent(student)
                                                        fetchUserActivity(student.id)
                                                    }}
                                                    title="View Activity"
                                                >
                                                    <ActivityIcon className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => setDeleteStudent(student)}
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Barcode Modal */}
            <Dialog open={!!barcodeStudent} onOpenChange={(open) => !open && setBarcodeStudent(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Barcode Siswa</DialogTitle>
                        <DialogDescription>{barcodeStudent?.full_name}</DialogDescription>
                    </DialogHeader>
                    {barcodeStudent && (
                        <div className="flex flex-col items-center py-4 space-y-4">
                            {barcodeStudent.identity ? (
                                <>
                                    <div className="bg-white p-4 rounded-xl border">
                                        <QRCodeSVG
                                            value={`https://zia.biz.id/id/${barcodeStudent.identity.public_token}`}
                                            size={200}
                                            level="H"
                                            includeMargin
                                        />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500">Token</p>
                                        <p className="font-mono text-sm">{barcodeStudent.identity.public_token}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500">NIS</p>
                                        <p className="font-mono font-bold">{barcodeStudent.identity.student_number || '-'}</p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-400">Belum ada barcode</p>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* NIS Edit Modal */}
            <Dialog open={!!nisStudent} onOpenChange={(open) => !open && setNisStudent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit NIS</DialogTitle>
                        <DialogDescription>{nisStudent?.full_name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Nomor Induk Siswa (NIS)</Label>
                            <Input
                                value={nisValue}
                                onChange={(e) => setNisValue(e.target.value)}
                                placeholder="Masukkan NIS"
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleUpdateNIS}
                            disabled={processing === 'nis'}
                        >
                            {processing === 'nis' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan NIS'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Activity Logs Modal */}
            <Dialog open={!!activityStudent} onOpenChange={(open) => !open && setActivityStudent(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Activity Logs</DialogTitle>
                        <DialogDescription>{activityStudent?.full_name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        {activities.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">No activity recorded</p>
                        ) : (
                            activities.map((activity) => (
                                <div key={activity.id} className="border-l-2 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r">
                                    <p className="text-sm font-medium">{activity.action}</p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(activity.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteStudent} onOpenChange={(open) => !open && setDeleteStudent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus User</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus <strong>{deleteStudent?.full_name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                        <p className="text-sm text-red-700">
                            ⚠️ Tindakan ini akan menghapus semua data user termasuk:
                        </p>
                        <ul className="text-xs text-red-600 mt-2 ml-4 list-disc">
                            <li>Profil dan identitas</li>
                            <li>Assignments dan notes</li>
                            <li>Messages dan activity logs</li>
                            <li>Class memberships</li>
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteStudent(null)}>
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            disabled={processing === 'delete'}
                        >
                            {processing === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hapus User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
