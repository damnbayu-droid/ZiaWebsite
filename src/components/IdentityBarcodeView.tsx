'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, ArrowRight } from 'lucide-react'

export function IdentityBarcodeView({ onEnter }: { onEnter: () => void }) {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [identity, setIdentity] = useState<any>(null)
    const [userId, setUserId] = useState<string>('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
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

            // Try to fetch student identity (may not exist for new users)
            const { data: identityData } = await supabase
                .from('student_identity')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle() // Use maybeSingle to avoid error if not found

            // If no identity exists, create one
            if (!identityData) {
                await createIdentity(user.id)
            } else {
                setIdentity(identityData)
            }
        } catch (e) {
            console.error('Error fetching data:', e)
        } finally {
            setLoading(false)
        }
    }

    const createIdentity = async (userId: string) => {
        try {
            // Generate a unique public token
            const publicToken = `ZIA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

            const now = new Date()
            const expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()) // 1 year from now

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

            if (error) {
                console.error('Error creating identity:', error)
                // Even if creation fails, we can still show the barcode with user ID
                setIdentity({
                    public_token: userId,
                    student_number: null
                })
            } else {
                setIdentity(data)
            }
        } catch (e) {
            console.error('Error creating identity:', e)
            // Fallback: use user ID as token
            setIdentity({
                public_token: userId,
                student_number: null
            })
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
    )

    // Use identity token or fallback to user ID
    const qrToken = identity?.public_token || userId
    const qrUrl = `https://zia.biz.id/id/${qrToken}`

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-600/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]" />

            <div className="w-full max-w-sm flex flex-col items-center z-10">
                <Avatar className="w-24 h-24 border-4 border-white/10 shadow-2xl mb-4">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-pink-600 text-white text-2xl font-bold">
                        {profile?.full_name?.[0]?.toUpperCase() || 'S'}
                    </AvatarFallback>
                </Avatar>

                <h1 className="text-2xl font-bold tracking-tight">{profile?.full_name || 'Siswa'}</h1>
                <p className="text-pink-400 text-sm font-medium">{profile?.school || 'SMAN 1 Kotabunan'}</p>
                <p className="text-gray-400 text-xs mt-1 mb-8 font-mono">
                    NIS: {identity?.student_number || '----------'}
                </p>

                <div className="bg-white p-4 rounded-3xl shadow-2xl mb-8 transform transition-transform hover:scale-105">
                    <QRCodeSVG value={qrUrl} size={220} level={'H'} includeMargin />
                </div>

                <div className="text-center space-y-1 mb-12">
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">ID Token</p>
                    <p className="text-sm font-bold tracking-tighter text-gray-300 break-all px-4">
                        {qrToken}
                    </p>
                </div>

                <Button
                    onClick={onEnter}
                    className="w-full h-14 rounded-2xl bg-white text-gray-900 font-bold text-lg hover:bg-gray-100 transition-all shadow-xl active:scale-95"
                >
                    Masuk <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <p className="mt-8 text-[10px] text-gray-500 uppercase tracking-widest">Digital Student Card • SMAN 1 Kotabunan</p>
            </div>
        </div>
    )
}
