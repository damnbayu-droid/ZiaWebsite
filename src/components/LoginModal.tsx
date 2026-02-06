'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ShieldAlert, LogIn, UserPlus, X } from 'lucide-react'

export function LoginModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const router = useRouter()

    const handleLogin = () => {
        router.push('/login')
    }

    const handleSignup = () => {
        router.push('/login?type=signup')
    }

    const handleLater = () => {
        router.push('/')
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md rounded-3xl p-6">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>

                <DialogHeader className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center">
                        <ShieldAlert className="w-8 h-8 text-pink-500" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold text-gray-900">Akses Terbatas</DialogTitle>
                        <DialogDescription className="text-sm mt-2">
                            Kamu perlu masuk atau mendaftar untuk menggunakan fitur ini dan menyimpan data belajarmu.
                        </DialogDescription>
                    </div>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 py-4">
                    <Button
                        onClick={handleLogin}
                        className="h-12 rounded-xl gradient-primary text-white font-bold gap-2"
                    >
                        <LogIn className="w-4 h-4" /> Masuk Sekarang
                    </Button>
                    <Button
                        onClick={handleSignup}
                        variant="outline"
                        className="h-12 rounded-xl border-gray-100 font-bold gap-2"
                    >
                        <UserPlus className="w-4 h-4" /> Daftar Akun Baru
                    </Button>
                </div>
                <DialogFooter className="sm:justify-center">
                    <button onClick={handleLater} className="text-xs text-gray-400 hover:text-gray-600 underline">
                        Nanti Saja
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
