'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, ArrowRight, ShieldCheck } from 'lucide-react'

export function IdentityBarcodeView({ onEnter }: { onEnter: () => void }) {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [identity, setIdentity] = useState<any>(null)

    useEffect(() => {
        fetchIdentity()
    }, [])

    const fetchIdentity = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('student_identity')
                .select(`
                    *,
                    profiles:user_id (full_name, avatar_url, grade),
                    schools:school_id (name)
                `)
                .eq('user_id', user.id)
                .single()

            setIdentity(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
    )

    if (!identity) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-pink-500/20 flex items-center justify-center mb-6">
                    <ShieldCheck className="w-10 h-10 text-pink-500" />
                </div>
                <h2 className="text-xl font-bold mb-2">Identitas Belum Aktif</h2>
                <p className="text-gray-400 text-sm mb-8">Data identitas digital kamu sedang diproses atau belum diaktifkan oleh Admin.</p>
                <Button onClick={onEnter} className="w-full max-w-xs h-12 rounded-xl gradient-primary text-white">
                    Masuk ke Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        )
    }

    const { profiles, schools, public_token, student_number } = identity
    const qrUrl = `https://zia.biz.id/id/${public_token}`

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-600/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]" />

            <div className="w-full max-w-sm flex flex-col items-center z-10">
                <Avatar className="w-24 h-24 border-4 border-white/10 shadow-2xl mb-4">
                    <AvatarImage src={profiles?.avatar_url || ''} />
                    <AvatarFallback className="bg-pink-600 text-white text-2xl font-bold">
                        {profiles?.full_name?.[0]?.toUpperCase() || 'S'}
                    </AvatarFallback>
                </Avatar>

                <h1 className="text-2xl font-bold tracking-tight">{profiles?.full_name}</h1>
                <p className="text-pink-400 text-sm font-medium">{schools?.name}</p>
                <p className="text-gray-400 text-xs mt-1 mb-8 font-mono">NIS: {student_number || '----------'}</p>

                <div className="bg-white p-4 rounded-3xl shadow-2xl mb-8 transform transition-transform hover:scale-105">
                    <QRCodeSVG value={qrUrl} size={220} level={'H'} includeMargin />
                </div>

                <div className="text-center space-y-1 mb-12">
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Public Token</p>
                    <p className="text-sm font-bold tracking-tighter text-gray-300">{public_token}</p>
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
