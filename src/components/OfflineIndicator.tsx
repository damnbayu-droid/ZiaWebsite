'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false)
    const [showOnline, setShowOnline] = useState(false)

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false)
            setShowOnline(true)
            setTimeout(() => setShowOnline(false), 3000)
        }
        const handleOffline = () => {
            setIsOffline(true)
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        setIsOffline(!navigator.onLine)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-gray-900 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold shadow-lg safe-area-inset-top"
                >
                    <WifiOff className="w-4 h-4 text-pink-400" />
                    Mode Offline. Anda masih dapat melihat data yang sudah dimuat.
                </motion.div>
            )}
            {showOnline && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-green-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold shadow-lg safe-area-inset-top"
                >
                    <Wifi className="w-4 h-4" />
                    Kembali Online! Menghubungkan...
                </motion.div>
            )}
        </AnimatePresence>
    )
}
