'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, ShieldCheck, Mail, Clock, ShieldAlert, GraduationCap, School as SchoolIcon, Edit2, MapPin, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface UnverifiedUser {
    id: string
    full_name: string
    email: string
    created_at: string
    avatar_url: string
}

export default function SystemControlPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<UnverifiedUser[]>([])
    const [processing, setProcessing] = useState<string | null>(null)
    const [approvingUser, setApprovingUser] = useState<UnverifiedUser | null>(null)
    const [editData, setEditData] = useState({
        full_name: '',
        school: '',
        grade: '',
        birth_place: '',
        birth_date: ''
    })
    const [verifiedUsers, setVerifiedUsers] = useState<UnverifiedUser[]>([])

    useEffect(() => {
        fetchUnverifiedUsers()
        fetchRecentVerified()
    }, [])

    const fetchRecentVerified = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('is_verified', true)
                .order('updated_at', { ascending: false })
                .limit(5)
            if (error) throw error
            setVerifiedUsers(data || [])
        } catch (e) {
            console.error('Error fetching recent verified:', e)
        }
    }

    const fetchUnverifiedUsers = async () => {
        try {
            setLoading(true)
            // Fetch users where is_verified is false or null
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('is_verified', false)
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (e: any) {
            console.error('Error fetching unverified users:', e.message || e)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenApproveDialog = (user: UnverifiedUser | any) => {
        setApprovingUser(user)
        setEditData({
            full_name: user.full_name || '',
            school: user.school || '',
            grade: user.grade || '',
            birth_place: user.birth_place || '',
            birth_date: user.birth_date || ''
        })
    }

    const handleVerifyConfirmed = async () => {
        if (!approvingUser) return
        try {
            setProcessing(approvingUser.id)
            // 1. Update Profile with manual data
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editData.full_name,
                    school: editData.school,
                    grade: editData.grade,
                    birth_place: editData.birth_place,
                    birth_date: editData.birth_date || null,
                    is_verified: true,
                    account_status: 'active'
                })
                .eq('id', approvingUser.id)

            if (error) throw error

            // 2. Log Activity
            await supabase.from('activity_logs').insert({
                action: 'verify_user_manual',
                details: {
                    target_user_id: approvingUser.id,
                    added_data: { school: editData.school, grade: editData.grade }
                },
                user_id: (await supabase.auth.getUser()).data.user?.id
            })

            // 3. Refresh
            setApprovingUser(null)
            await fetchUnverifiedUsers()
            await fetchRecentVerified()
            alert('User verified and data updated successfully.')
        } catch (e) {
            console.error(e)
            alert('Failed to verify user.')
        } finally {
            setProcessing(null)
        }
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-pink-600" /></div>

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Verifikasi User</h2>
                <p className="text-gray-500">Pusat persetujuan akun siswa baru.</p>
            </div>

            <div className="grid gap-6">
                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-orange-600" />
                            Pending Verification Queue
                        </CardTitle>
                        <CardDescription>
                            These accounts have registered but cannot access the platform yet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {users.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                <h3 className="font-medium text-gray-900">All Caught Up!</h3>
                                <p className="text-sm text-gray-500">No pending verifications.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {users.map(user => (
                                    <div key={user.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-bold text-lg">
                                                {user.full_name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{user.full_name}</h4>
                                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {user.email}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mt-4 md:mt-0 w-full md:w-auto">
                                            <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
                                                Pending
                                            </Badge>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
                                                onClick={() => handleOpenApproveDialog(user)}
                                                disabled={processing === user.id}
                                            >
                                                {processing === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Review & Approve'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Approve & Edit Dialog */}
                <Dialog open={!!approvingUser} onOpenChange={(open) => !open && setApprovingUser(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Review & Verifikasi Akun</DialogTitle>
                            <DialogDescription>
                                Lengkapi data siswa sebelum memberikan akses ke platform.
                            </DialogDescription>
                        </DialogHeader>

                        {approvingUser && (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nama Lengkap</Label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            value={editData.full_name}
                                            onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                                            placeholder="Nama Lengkap"
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tempat Lahir</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                value={editData.birth_place}
                                                onChange={(e) => setEditData({ ...editData, birth_place: e.target.value })}
                                                placeholder="Contoh: Kotabunan"
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tanggal Lahir</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                type="date"
                                                value={editData.birth_date}
                                                onChange={(e) => setEditData({ ...editData, birth_date: e.target.value })}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Sekolah</Label>
                                        <div className="relative">
                                            <SchoolIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                value={editData.school}
                                                onChange={(e) => setEditData({ ...editData, school: e.target.value })}
                                                placeholder="Contoh: SMAN 1"
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kelas</Label>
                                        <div className="relative">
                                            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                value={editData.grade}
                                                onChange={(e) => setEditData({ ...editData, grade: e.target.value })}
                                                placeholder="Contoh: X IPA 1"
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-3 rounded-lg flex gap-3 text-xs text-blue-700 border border-blue-100 italic">
                                    <Mail className="w-4 h-4 flex-shrink-0" />
                                    <span>Klik 'Selesaikan Verifikasi' akan membuka akses dashboard bagi <strong>{approvingUser.email}</strong>.</span>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setApprovingUser(null)} disabled={processing === approvingUser?.id}>
                                Batal
                            </Button>
                            <Button
                                onClick={handleVerifyConfirmed}
                                className="bg-pink-600 hover:bg-pink-700"
                                disabled={processing === approvingUser?.id || !editData.full_name || !editData.school || !editData.grade}
                            >
                                {processing === approvingUser?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Selesaikan Verifikasi'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Verified Users List */}
                < Card >
                    <CardHeader>
                        <CardTitle className="text-gray-700">Recently Verified Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {verifiedUsers.length === 0 ? (
                            <p className="text-gray-500 text-sm italic">Belum ada user yang diverifikasi baru-baru ini.</p>
                        ) : (
                            <div className="space-y-3">
                                {verifiedUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8 border">
                                                <AvatarImage src={user.avatar_url} />
                                                <AvatarFallback className="text-[10px]">{user.full_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                                                <p className="text-[10px] text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] border-0">
                                            Verified
                                        </Badge>
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" className="w-full text-gray-500 text-xs mt-2" onClick={() => window.location.href = '/admin/users'}>
                                    Lihat Semua di User Management
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card >
            </div >
        </div >
    )
}
