'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Download, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import Link from 'next/link'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function StudentIdentityPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [identity, setIdentity] = useState<any>(null)
    const [userId, setUserId] = useState<string>('')
    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchIdentity()
    }, [])

    const fetchIdentity = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setUserId(user.id)

            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, grade, school')
                .eq('id', user.id)
                .single()

            setProfile(profileData)

            // Try to fetch student identity
            const { data: identityData } = await supabase
                .from('student_identity')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle()

            // If no identity exists, create one
            if (!identityData) {
                await createIdentity(user.id)
            } else {
                setIdentity(identityData)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const createIdentity = async (userId: string) => {
        try {
            const publicToken = `ZIA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            const now = new Date()
            const expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())

            const { data, error } = await supabase
                .from('student_identity')
                .insert({
                    user_id: userId,
                    public_token: publicToken,
                    activated_at: now.toISOString(),
                    expires_at: expiresAt.toISOString(),
                    is_active: true
                })
                .select()
                .single()

            if (!error && data) {
                setIdentity(data)
            } else {
                // Fallback
                setIdentity({
                    public_token: userId,
                    student_number: null,
                    expires_at: expiresAt.toISOString()
                })
            }
        } catch (e) {
            console.error(e)
        }
    }

    const downloadPNG = async () => {
        if (!cardRef.current) return
        try {
            const canvas = await html2canvas(cardRef.current, { scale: 3 } as any)
            const link = document.createElement('a')
            link.download = `kartu-pelajar-${profile?.full_name || 'siswa'}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        } catch (e) {
            alert('Gagal mengunduh gambar')
        }
    }

    const downloadPDF = async () => {
        if (!cardRef.current) return
        try {
            const canvas = await html2canvas(cardRef.current, { scale: 3 } as any)
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a6')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width

            pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight)
            pdf.save(`kartu-pelajar-${profile?.full_name || 'siswa'}.pdf`)
        } catch (e) {
            alert('Gagal mengunduh PDF')
        }
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
        )
    }

    if (!identity || !profile) {
        return (
            <div className="p-4 space-y-4">
                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                            <AlertCircle className="w-5 h-5" />
                            Belum Aktif
                        </CardTitle>
                        <CardDescription className="text-orange-600">
                            Identitas digital kamu sedang diproses. Refresh halaman ini dalam beberapa saat.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const qrToken = identity?.public_token || userId
    const qrUrl = `${window.location.origin}/id/${qrToken}`

    return (
        <div className="p-4 pb-24 space-y-6 max-w-lg mx-auto">
            <h1 className="text-xl font-bold text-gray-900">Kartu Pelajar Digital</h1>

            {/* Rendered Card Area */}
            <div ref={cardRef} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-pink-500 to-rose-600" />

                <div className="relative z-10 mt-8 mb-4">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-pink-100 text-pink-600 text-2xl font-bold border-4 border-white shadow-md flex items-center justify-center w-full h-full rounded-full">
                            {profile?.full_name?.[0]?.toUpperCase() || 'S'}
                        </AvatarFallback>
                    </Avatar>
                </div>

                <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || 'Siswa'}</h2>
                <p className="text-sm text-gray-500 mb-1">{profile?.school || 'SMAN 1 Kotabunan'}</p>
                <div className="flex gap-2 justify-center mb-6">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 font-medium">
                        {profile?.grade || 'Siswa'}
                    </span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Aktif
                    </span>
                </div>

                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 mb-4">
                    <QRCodeSVG value={qrUrl} size={160} level={'H'} includeMargin />
                </div>

                <p className="text-[10px] text-gray-400 font-mono">
                    Token: {qrToken}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    Berlaku hingga: {format(new Date(identity.expires_at), 'dd MMM yyyy', { locale: id })}
                </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
                <Button onClick={downloadPNG} variant="outline" className="h-12 rounded-xl gap-2">
                    <Download className="w-4 h-4" /> PNG
                </Button>
                <Button onClick={downloadPDF} variant="outline" className="h-12 rounded-xl gap-2">
                    <Download className="w-4 h-4" /> PDF
                </Button>
                <Link href={`/id/${qrToken}`} target="_blank" className="col-span-2">
                    <Button className="w-full h-12 rounded-xl gradient-primary text-white gap-2">
                        <ExternalLink className="w-4 h-4" /> Lihat Halaman Publik
                    </Button>
                </Link>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-center text-gray-400 px-4">
                QR Code ini adalah identitas resmi di lingkungan sekolah. Jangan bagikan kepada pihak yang tidak berkepentingan.
            </p>
        </div>
    )
}
