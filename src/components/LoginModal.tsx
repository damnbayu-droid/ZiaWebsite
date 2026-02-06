'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ShieldAlert, LogIn, UserPlus } from 'lucide-react'

export function LoginModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const router = useRouter()

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md rounded-3xl p-6">
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
                        onClick={() => router.push('/login')}
                        className="h-12 rounded-xl gradient-primary text-white font-bold gap-2"
                    >
                        <LogIn className="w-4 h-4" /> Masuk Sekarang
                    </Button>
                    <Button
                        onClick={() => router.push('/login?type=signup')}
                        variant="outline"
                        className="h-12 rounded-xl border-gray-100 font-bold gap-2"
                    >
                        <UserPlus className="w-4 h-4" /> Daftar Akun Baru
                    </Button>
                </div>
                <DialogFooter className="sm:justify-center">
                    <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 underline">
                        Nanti Saja
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
