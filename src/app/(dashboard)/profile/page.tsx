'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Camera, User, School, GraduationCap, ArrowLeft, LogOut, QrCode, ChevronRight } from 'lucide-react'

// Define Profile interface locally or import from types
interface Profile {
    id: string
    full_name: string
    avatar_url: string | null
    school: string | null
    grade: string | null
    role: string | null
    updated_at: string
}

export default function ProfilePage() {
    const router = useRouter()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [profile, setProfile] = useState<Profile | null>(null)

    // Form states
    const [fullName, setFullName] = useState('')
    const [school, setSchool] = useState('')
    const [grade, setGrade] = useState('')
    const [email, setEmail] = useState('')

    useEffect(() => {
        getProfile()
    }, [])

    const getProfile = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (user?.email) {
                setEmail(user.email)
            }

            if (!user) {
                router.push('/login')
                return
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (data) {
                setProfile(data)
                setFullName(data.full_name || '')
                setSchool(data.school || '')
                setGrade(data.grade || '')
            } else if (error) {
                // SIlently fail or log warning if just missing profile
                console.warn('Profile missing or error:', error.message)
            }
        } catch (error) {
            console.error('Unexpected error loading user data')
        } finally {
            setLoading(false)
        }
    }

    // ... (updateProfile stays same) - restoring actual code
    const updateProfile = async () => {
        try {
            setUpdating(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error('No user')

            const updates = {
                id: user.id,
                full_name: fullName,
                school,
                grade,
                updated_at: new Date().toISOString(),
            }

            const { error } = await supabase.from('profiles').upsert(updates)

            if (error) throw error
            alert('Profil berhasil diperbarui!')

            // Refresh local data
            getProfile()
        } catch (error) {
            alert('Gagal memperbarui profil!')
            console.error(error)
        } finally {
            setUpdating(false)
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    // Force Admin for specific email or role
    const isAdmin = profile?.role === 'admin' || email === 'damnbayu@gmail.com'

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)

            const { data: { user } } = await supabase.auth.getUser()
            if (!user || !event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.')
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const filePath = `${user.id}/${Math.random()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // Update profile
            // Use update() instead of upsert() to avoid accidental insert attempts
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    avatar_url: publicUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)

            if (updateError) {
                throw updateError
            }

            await getProfile() // Refresh UI
            alert('Foto profil diperbarui!')

        } catch (error: any) {
            alert(`Gagal mengunggah foto: ${error.message || error}`)
            console.error(error)
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 safe-area-inset-bottom">
            {/* Header */}
            <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm flex items-center justify-between">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Profil Saya</h1>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-6">

                {/* Avatar Section */}
                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <Avatar className="w-28 h-28 border-4 border-white shadow-md">
                            <AvatarImage src={profile?.avatar_url || ''} />
                            <AvatarFallback className="bg-pink-100 text-pink-600 text-2xl font-bold">
                                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute bottom-1 right-1 p-2 bg-pink-500 text-white rounded-full shadow-lg h-9 w-9 flex items-center justify-center hover:bg-pink-600 transition-colors"
                        >
                            {uploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Camera className="w-4 h-4" />
                            )}
                        </button>
                        <input
                            style={{
                                visibility: 'hidden',
                                position: 'absolute',
                            }}
                            type="file"
                            id="single"
                            accept="image/*"
                            onChange={uploadAvatar}
                            ref={fileInputRef}
                            disabled={uploading}
                        />
                    </div>
                    <p className="mt-3 font-semibold text-gray-900">{profile?.full_name || 'Siswa'}</p>
                    <p className="text-sm text-gray-500">{email}</p>
                </div>

                {/* Identity Card Menu */}
                <Link href="/profile/identity" className="block">
                    <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white mb-6">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <QrCode className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Kartu Pelajar Digital</h3>
                                    <p className="text-xs text-pink-100">Klik untuk melihat QR Code</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-pink-100" />
                        </CardContent>
                    </Card>
                </Link>

                {isAdmin && (
                    <Link href="/admin" className="block">
                        <Card className="border-0 shadow-sm rounded-2xl bg-gray-900 text-white mb-6">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white/20 rounded-xl">
                                        <div className="w-6 h-6 flex items-center justify-center font-bold">A</div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Admin Dashboard</h3>
                                        <p className="text-xs text-gray-400">Kelola siswa & identitas</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </CardContent>
                        </Card>
                    </Link>
                )}

                {/* Edit Form */}
                <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg">Informasi Pribadi</CardTitle>
                        <CardDescription>Perbarui data dirimu di sini.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-sm font-medium">Nama Lengkap</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="pl-9 h-11 rounded-xl"
                                    placeholder="Nama Lengkap"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="school" className="text-sm font-medium">Sekolah</Label>
                            <div className="relative">
                                <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="school"
                                    value={school}
                                    onChange={(e) => setSchool(e.target.value)}
                                    className="pl-9 h-11 rounded-xl"
                                    placeholder="Nama Sekolah"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="grade" className="text-sm font-medium">Kelas</Label>
                            <div className="relative">
                                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="grade"
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    className="pl-9 h-11 rounded-xl"
                                    placeholder="Contoh: X IPA 1"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={updateProfile}
                            disabled={updating}
                            className="w-full h-11 rounded-xl gradient-primary text-white mt-2"
                        >
                            {updating ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Menyimpan...
                                </span>
                            ) : 'Simpan Perubahan'}
                        </Button>

                    </CardContent>
                </Card>
                {/* Logout Button */}
                <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 mb-8"
                    onClick={handleSignOut}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Keluar
                </Button>



            </main>
        </div >
    )
}
