'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Search, Activity as ActivityIcon } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface Log {
    id: string
    action: string
    user_name: string
    details: any
    created_at: string
    user_id: string
    profiles?: {
        full_name: string
        avatar_url: string
    }
}

export default function ReportsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [logs, setLogs] = useState<Log[]>([])
    const [search, setSearch] = useState('')

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
                    profiles:user_id(full_name, avatar_url)
                `)
                .order('created_at', { ascending: false })
                .limit(100)

            if (error) throw error
            setLogs(data || [])
        } catch (e: any) {
            console.error('Error fetching logs:', e.message || e)
        } finally {
            setLoading(false)
        }
    }

    const getActionBadge = (action: string) => {
        if (action.includes('login')) return <Badge className="bg-green-100 text-green-700 border-0">Login</Badge>
        if (action.includes('logout')) return <Badge className="bg-gray-100 text-gray-700 border-0">Logout</Badge>
        if (action.includes('create')) return <Badge className="bg-blue-100 text-blue-700 border-0">Create</Badge>
        if (action.includes('delete')) return <Badge className="bg-red-100 text-red-700 border-0">Delete</Badge>
        if (action.includes('update') || action.includes('edit')) return <Badge className="bg-orange-100 text-orange-700 border-0">Update</Badge>
        if (action.includes('view')) return <Badge className="bg-purple-100 text-purple-700 border-0">View</Badge>
        return <Badge variant="secondary">{action}</Badge>
    }

    const filteredLogs = logs.filter(log =>
        log.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Activity Logs & Reports</h2>
                <p className="text-gray-500">Real-time audit log of all user interactions.</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                        <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{logs.length}</div>
                        <p className="text-xs text-muted-foreground">Last 100 records</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="Search by user or action..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-white"
                />
            </div>

            {/* Activity Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500">
                                            {search ? 'No matching logs found' : 'No activity logs yet'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                                {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarImage src={log.profiles?.avatar_url} />
                                                        <AvatarFallback className="text-xs">
                                                            {log.user_name?.[0] || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-gray-900">
                                                        {log.user_name || 'Unknown User'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {getActionBadge(log.action)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                                                {log.details && typeof log.details === 'object'
                                                    ? Object.entries(log.details).map(([key, value]) => `${key}: ${value}`).join(', ')
                                                    : '-'
                                                }
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
