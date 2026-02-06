import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, School, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default async function PublicIdentityPage({
    params
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = await params
    const supabase = await createServerClient()

    // Fetch Identity
    const { data: identity, error } = await supabase
        .from('student_identity')
        .select('*')
        .eq('public_token', token)
        .single()

    if (!identity) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <Card className="w-full max-w-md shadow-xl border-red-200 bg-red-50">
                    <CardContent className="flex flex-col items-center py-10 text-center space-y-4">
                        <XCircle className="w-16 h-16 text-red-500" />
                        <h2 className="text-2xl font-bold text-red-700">Identitas Tidak Valid</h2>
                        <p className="text-red-600">
                            Kartu Pelajar Digital ini tidak valid, kedaluwarsa, atau telah dicabut.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Fetch profile separately
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, grade, school')
        .eq('id', identity.user_id)
        .single()

    const isExpired = new Date(identity.expires_at) < new Date()
    const isActive = identity?.is_active ?? false

    if (!isActive || isExpired) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <Card className="w-full max-w-md shadow-xl border-orange-200 bg-orange-50">
                    <CardContent className="flex flex-col items-center py-10 text-center space-y-4">
                        <XCircle className="w-16 h-16 text-orange-500" />
                        <h2 className="text-2xl font-bold text-orange-700">Identitas Kedaluwarsa</h2>
                        <p className="text-orange-600">
                            Kartu Pelajar Digital ini sudah tidak berlaku.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
                {/* Header / Banner */}
                <div className="bg-gradient-to-r from-pink-500 to-rose-600 h-32 relative">
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                        <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                            <AvatarImage src={profile?.avatar_url || ''} />
                            <AvatarFallback className="bg-gray-100 text-gray-500 text-2xl font-bold">
                                {profile?.full_name?.[0] || 'S'}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>

                <CardContent className="pt-16 pb-6 text-center space-y-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{profile?.full_name || 'Siswa'}</h1>
                        <Badge variant="outline" className="mt-1 border-pink-200 text-pink-700 bg-pink-50 px-3 py-0.5 rounded-full">
                            Siswa Aktif
                        </Badge>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <School className="w-5 h-5 text-gray-400" />
                            <div className="text-left">
                                <p className="text-xs text-gray-500">Sekolah</p>
                                <p className="font-medium text-gray-900 line-clamp-1">
                                    {profile?.school || 'SMAN 1 Kotabunan'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <User className="w-5 h-5 text-gray-400" />
                            <div className="text-left">
                                <p className="text-xs text-gray-500">Kelas / Tingkat</p>
                                <p className="font-medium text-gray-900">{profile?.grade || '-'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <CheckCircle className="w-5 h-5 text-gray-400" />
                            <div className="text-left">
                                <p className="text-xs text-gray-500">Nomor Induk Siswa (NIS)</p>
                                <p className="font-bold text-gray-900 font-mono tracking-wider">
                                    {identity.student_number || '-'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div className="text-left">
                                <p className="text-xs text-gray-500">Berlaku Hingga</p>
                                <p className="font-medium text-gray-900">
                                    {format(new Date(identity.expires_at), 'dd MMMM yyyy', { locale: id })}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="bg-gray-50 py-4 text-center justify-center flex flex-col gap-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Identitas Digital Resmi
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                        Zia Archive • zia.biz.id
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
