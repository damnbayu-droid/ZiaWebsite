'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogIn, LogOut, Activity, Lock, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface Log {
    id: string
    action: string
    details: any
    created_at: string
    user?: {
        full_name: string
        email: string
    }
    user_id: string
}

export default function ReportsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [logs, setLogs] = useState<Log[]>([])

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('activity_logs')
                .select(`
                    *,
                    user:profiles(full_name, email)
                `)
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error
            setLogs(data || [])
        } catch (e: any) {
            console.error('Error fetching logs:', e.message || e)
        } finally {
            setLoading(false)
        }
    }

    const getIcon = (action: string) => {
        if (action.includes('login')) return <LogIn className="w-4 h-4 text-green-500" />
        if (action.includes('logout')) return <LogOut className="w-4 h-4 text-gray-500" />
        if (action.includes('verify')) return <Lock className="w-4 h-4 text-blue-500" />
        if (action.includes('delete')) return <Trash2 className="w-4 h-4 text-red-500" />
        return <Activity className="w-4 h-4 text-purple-500" />
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">System Reports & Activity</h2>
                <p className="text-gray-500">Real-time audit log of user interactions.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="p-4">Time</th>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50">
                                        <td className="p-4 text-gray-500 whitespace-nowrap">
                                            {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">
                                                {/* @ts-ignore */}
                                                {log.user?.full_name || 'Unknown User'}
                                            </div>
                                            {/* @ts-ignore */}
                                            <div className="text-xs text-gray-500">{log.user?.email || log.user_id}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {getIcon(log.action)}
                                                <span className="capitalize">{log.action.replace(/_/g, ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500 max-w-md truncate">
                                            {JSON.stringify(log.details)}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500">
                                            No logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
