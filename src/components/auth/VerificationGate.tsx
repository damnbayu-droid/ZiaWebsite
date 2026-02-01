'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function VerificationGate({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [verified, setVerified] = useState<boolean | null>(null)

    // Public routes that don't need verification
    const publicRoutes = ['/login', '/auth/callback', '/pending-verification']

    useEffect(() => {
        if (publicRoutes.includes(pathname)) {
            setVerified(true) // Bypass check
            return
        }

        const checkVerification = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                // Not logged in, middleware handles redirect usually, 
                // but strictly no verification needed if no user
                setVerified(true)
                return
            }

            // EMERGENCY BYPASS FOR ADMIN
            if (session.user.email === 'damnbayu@gmail.com') {
                setVerified(true)
                return
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('is_verified, role')
                .eq('id', session.user.id)
                .single()

            if (data?.is_verified) {
                setVerified(true)
            } else {
                // Not verified
                // ALLOW: Profile pages
                if (pathname.startsWith('/profile')) {
                    setVerified(true)
                    return
                }

                // BLOCK: App features -> Redirect to Pending
                router.push('/pending-verification')
            }
        }

        checkVerification()
    }, [pathname])

    if (verified === null && !publicRoutes.includes(pathname)) {
        // Show nothing while checking (or a spinner)
        return null
    }

    return <>{children}</>
}
