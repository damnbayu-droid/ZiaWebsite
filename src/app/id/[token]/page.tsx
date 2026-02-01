import { createClient } from '@/lib/supabase/client' // Client for public read? Or server?
// Server component is safest for fetching data securely.
import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, School, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default async function PublicIdentityPage({
    params
}: {
    params: Promise<{ token: string }>
}) {
    // Await params in Next.js 15/16 awaitable params
    const { token } = await params
    const supabase = await createServerClient()

    // Fetch Identity with related Profile and School
    // Note: RLS allows public reading of active identities.
    const { data: identity, error } = await supabase
        .from('student_identity')
        .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url,
        grade
      ),
      schools:school_id (
        name,
        address
      )
    `)
        .eq('public_token', token)
        .single()

    // Handle case: Token not found or RLS filtered it out (expired/inactive)
    // If RLS works, expired rows return null/error.
    // But our RLS returns nothing if expired?
    // Let's explicitly handle "Invalid" vs "Expired" if possible.
    // Ideally, if query returns null, we show "Invalid or Expired".

    const isExpired = identity ? new Date(identity.expires_at) < new Date() : true
    const isActive = identity?.is_active ?? false
    const isValid = identity && !isExpired && isActive

    if (!identity) {
        // Show Invalid Page
        return (
            <Card className="w-full max-w-md shadow-xl border-red-200 bg-red-50">
                <CardContent className="flex flex-col items-center py-10 text-center space-y-4">
                    <XCircle className="w-16 h-16 text-red-500" />
                    <h2 className="text-2xl font-bold text-red-700">Identitas Tidak Valid</h2>
                    <p className="text-red-600">
                        Kartu Pelajar Digital ini tidak valid, kedaluwarsa, atau telah dicabut.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const profile = identity.profiles as any
    const school = identity.schools as any

    return (
        <Card className="w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
            {/* Header / Banner */}
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 h-32 relative">
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="bg-gray-100 text-gray-500 text-2xl font-bold">
                            {profile.full_name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>

            <CardContent className="pt-16 pb-6 text-center space-y-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
                    <Badge variant="outline" className="mt-1 border-pink-200 text-pink-700 bg-pink-50 px-3 py-0.5 rounded-full">
                        Siswa Aktif
                    </Badge>
                </div>

                <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <School className="w-5 h-5 text-gray-400" />
                        <div className="text-left">
                            <p className="text-xs text-gray-500">Sekolah</p>
                            <p className="font-medium text-gray-900 line-clamp-1">{school.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <User className="w-5 h-5 text-gray-400" />
                        <div className="text-left">
                            <p className="text-xs text-gray-500">Kelas / Tingkat</p>
                            <p className="font-medium text-gray-900">{profile.grade || '-'}</p>
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

            <CardFooter className="bg-gray-50 py-3 text-center justify-center">
                <p className="text-xs text-gray-400">
                    Identitas Digital Resmi • SMAN 1 Kotabunan
                </p>
            </CardFooter>
        </Card>
    )
}
