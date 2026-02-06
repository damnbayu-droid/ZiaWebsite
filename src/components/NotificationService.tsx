'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function NotificationService() {
    const supabase = createClient()
    const [activeNotification, setActiveNotification] = useState<any>(null)

    useEffect(() => {
        const interval = setInterval(() => {
            checkNotifications()
        }, 1000 * 60 * 5) // Check every 5 mins

        checkNotifications() // Initial check
        return () => clearInterval(interval)
    }, [])

    const checkNotifications = async () => {
        const now = new Date()
        const hour = now.getHours()
        const minute = now.getMinutes()

        // 1. Scheduled Reminders (10 PM & 5:30 AM)
        if ((hour === 22 && minute < 5) || (hour === 5 && minute >= 30 && minute < 35)) {
            showReminder("Semangat belajar! Jangan lupa cek tugasmu untuk besok ya.")
        }

        // 2. Assignment Specific Checks
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: assignments } = await supabase
                .from('assignments')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'open')

            if (assignments && assignments.length > 0) {
                const urgent = assignments.find(a => {
                    const due = new Date(a.due_date)
                    const diff = due.getTime() - now.getTime()
                    return diff > 0 && diff < 1000 * 60 * 60 * 24 // Due in 24h
                })

                if (urgent) {
                    showReminder(`Tugas "${urgent.title}" segera berakhir! Yuk selesaikan sekarang.`)
                }
            }
        } catch (e) {
            console.error('Notification check failed')
        }
    }

    const showReminder = (text: string) => {
        // Prevent showing too many
        if (activeNotification) return
        setActiveNotification({ text })
        setTimeout(() => setActiveNotification(null), 10000)
    }

    return (
        <AnimatePresence>
            {activeNotification && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 20, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-4 right-4 z-[100] max-w-sm mx-auto"
                >
                    <div className="bg-white border-2 border-pink-100 shadow-2xl rounded-2xl p-4 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0">
                            <Bell className="w-5 h-5 text-pink-600 animate-swing" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-sm">Pengingat Zia</h4>
                            <p className="text-xs text-gray-500 mt-1">{activeNotification.text}</p>
                        </div>
                        <button onClick={() => setActiveNotification(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
