'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, ShieldAlert, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PendingVerificationPage() {
    const router = useRouter()
    const supabase = createClient()
    const [email, setEmail] = useState('')

    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }
        setEmail(user.email || '')

        // Double check status, maybe they are verified now?
        const { data } = await supabase.from('profiles').select('is_verified').eq('id', user.id).single()
        if (data?.is_verified) {
            router.push('/')
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full space-y-6 border-t-4 border-orange-500">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                    <ShieldAlert className="w-8 h-8" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Akun Menunggu Verifikasi</h1>
                    <p className="text-gray-500 mt-2">
                        Halo <span className="font-semibold text-gray-900">{email}</span>, akun Anda telah dibuat tetapi belum diverifikasi oleh Administrator.
                    </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-xl text-orange-700 text-sm">
                    <p>Silakan tunggu Admin menyetujui akun Anda agar dapat mengakses materi belajar.</p>
                </div>

                <div className="space-y-3 pt-2">
                    <Button
                        onClick={() => window.location.reload()}
                        className="w-full bg-gray-900 hover:bg-gray-800"
                    >
                        Cek Status Lagi
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <LogOut className="w-4 h-4 mr-2" /> Keluar
                    </Button>
                </div>
            </div>
            <p className="mt-8 text-xs text-gray-400">ID: Pending Verification</p>
        </div>
    )
}
