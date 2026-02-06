'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, ArrowLeft, UserPlus, MessageSquare, Users, GraduationCap, Trash2 } from 'lucide-react'

export default function ClassDetailPage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const classId = params.id as string

    const [loading, setLoading] = useState(true)
    const [classData, setClassData] = useState<any>(null)
    const [members, setMembers] = useState<any[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [isMember, setIsMember] = useState(false)
    const [isCreator, setIsCreator] = useState(false)

    useEffect(() => {
        fetchClassData()
    }, [classId])

    const fetchClassData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setCurrentUserId(user.id)

            // Fetch class details
            const { data: cls, error: clsError } = await supabase
                .from('classes')
                .select(`
                    *,
                    creator:created_by(full_name, avatar_url)
                `)
                .eq('id', classId)
                .single()

            if (clsError) throw clsError
            setClassData(cls)
            setIsCreator(cls.created_by === user.id)

            // Fetch members
            const { data: memberData, error: memberError } = await supabase
                .from('class_members')
                .select(`
                    *,
                    user:user_id(
                        id,
                        full_name,
                        avatar_url,
                        grade
                    )
                `)
                .eq('class_id', classId)
                .order('joined_at', { ascending: false })

            if (memberError) throw memberError
            setMembers(memberData || [])
            setIsMember(memberData?.some(m => m.user_id === user.id) || false)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleJoinClass = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('class_members')
                .insert({
                    class_id: classId,
                    user_id: user.id,
                    role: 'member'
                })

            if (error) throw error

            fetchClassData()
            alert('Berhasil bergabung ke kelas!')
        } catch (error) {
            console.error(error)
            alert('Gagal bergabung ke kelas')
        }
    }

    const handleLeaveClass = async () => {
        if (!confirm('Yakin ingin keluar dari kelas ini?')) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('class_members')
                .delete()
                .eq('class_id', classId)
                .eq('user_id', user.id)

            if (error) throw error

            router.push('/classes')
        } catch (error) {
            console.error(error)
            alert('Gagal keluar dari kelas')
        }
    }

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Yakin ingin mengeluarkan anggota ini?')) return

        try {
            const { error } = await supabase
                .from('class_members')
                .delete()
                .eq('id', memberId)

            if (error) throw error

            fetchClassData()
            alert('Anggota berhasil dikeluarkan')
        } catch (error) {
            console.error(error)
            alert('Gagal mengeluarkan anggota')
        }
    }

    const handleSendMessage = (userId: string) => {
        // Navigate to messages with pre-selected user
        router.push(`/messages?user=${userId}`)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
        )
    }

    if (!classData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">Kelas tidak ditemukan</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 safe-area-inset-bottom">
            <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <Link href="/classes" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </Link>
                    {isMember && !isCreator && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLeaveClass}
                            className="text-red-500 border-red-200 hover:bg-red-50"
                        >
                            Keluar Kelas
                        </Button>
                    )}
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl">
                        {classData.grade_level}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-gray-900">{classData.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                Kelas {classData.grade_level}
                            </Badge>
                            <span className="text-xs text-gray-500">
                                {members.length} anggota
                            </span>
                        </div>
                        {classData.description && (
                            <p className="text-sm text-gray-600 mt-2">{classData.description}</p>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* Join Button for Non-Members */}
                {!isMember && (
                    <Card className="border-0 shadow-sm rounded-2xl p-4 bg-gradient-to-r from-pink-50 to-purple-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900">Bergabung dengan Kelas</h3>
                                <p className="text-xs text-gray-600 mt-1">Akses materi dan diskusi bersama</p>
                            </div>
                            <Button onClick={handleJoinClass} className="rounded-xl gradient-primary text-white">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Gabung
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Members List */}
                <div className="space-y-3">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-pink-600" />
                        Anggota Kelas
                    </h2>

                    {/* Creator */}
                    <Card className="border-0 shadow-sm rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12 border-2 border-pink-200">
                                <AvatarImage src={classData.creator?.avatar_url} />
                                <AvatarFallback className="bg-pink-100 text-pink-600 font-bold">
                                    {classData.creator?.full_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{classData.creator?.full_name}</h4>
                                <Badge className="text-[10px] bg-pink-100 text-pink-700 hover:bg-pink-100">
                                    Pembuat Kelas
                                </Badge>
                            </div>
                            {currentUserId !== classData.created_by && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSendMessage(classData.created_by)}
                                    className="rounded-full"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </Card>

                    {/* Members */}
                    {members.map((member) => (
                        <Card key={member.id} className="border-0 shadow-sm rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={member.user?.avatar_url} />
                                    <AvatarFallback className="bg-gray-100 text-gray-600 font-bold">
                                        {member.user?.full_name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{member.user?.full_name}</h4>
                                    {member.user?.grade && (
                                        <p className="text-xs text-gray-500">{member.user.grade}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {currentUserId !== member.user_id && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleSendMessage(member.user_id)}
                                            className="rounded-full"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </Button>
                                    )}
                                    {isCreator && member.user_id !== currentUserId && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="rounded-full text-red-500 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}

                    {members.length === 0 && (
                        <p className="text-center text-gray-400 py-8 text-sm">
                            Belum ada anggota di kelas ini
                        </p>
                    )}
                </div>
            </main>
        </div>
    )
}
