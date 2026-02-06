'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CheckCircle, XCircle, Activity, FileText, GraduationCap, MessageSquare } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

export default function AdminOverviewPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalUsers: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0,
        totalAssignments: 0,
        totalClasses: 0,
        totalMessages: 0
    })
    const [recentActivity, setRecentActivity] = useState<any[]>([])

    useEffect(() => {
        fetchStats()
        fetchRecentActivity()
    }, [])

    const fetchStats = async () => {
        try {
            // Fetch user counts
            const { count: totalUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })

            const { count: verifiedUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('is_verified', true)

            // Fetch assignments count
            const { count: totalAssignments } = await supabase
                .from('assignments')
                .select('*', { count: 'exact', head: true })

            // Fetch classes count
            const { count: totalClasses } = await supabase
                .from('classes')
                .select('*', { count: 'exact', head: true })

            // Fetch messages count
            const { count: totalMessages } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })

            setStats({
                totalUsers: totalUsers || 0,
                verifiedUsers: verifiedUsers || 0,
                unverifiedUsers: (totalUsers || 0) - (verifiedUsers || 0),
                totalAssignments: totalAssignments || 0,
                totalClasses: totalClasses || 0,
                totalMessages: totalMessages || 0
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchRecentActivity = async () => {
        try {
            const { data } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5)

            setRecentActivity(data || [])
        } catch (error) {
            console.error('Error fetching activity:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">System Overview</h2>
                <p className="text-gray-500">Realtime monitoring and platform statistics.</p>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">Registered Accounts</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.verifiedUsers}</div>
                        <p className="text-xs text-muted-foreground">Active Students</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
                        <XCircle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.unverifiedUsers}</div>
                        <p className="text-xs text-muted-foreground">Awaiting Approval</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAssignments}</div>
                        <p className="text-xs text-muted-foreground">Created Tasks</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalClasses}</div>
                        <p className="text-xs text-muted-foreground">Active Classes</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalMessages}</div>
                        <p className="text-xs text-muted-foreground">Sent Messages</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentActivity.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
                        ) : (
                            recentActivity.map((activity) => (
                                <div key={activity.id} className="border-l-2 border-blue-500 pl-4 py-1">
                                    <p className="text-sm font-medium">{activity.user_name}</p>
                                    <p className="text-xs text-gray-600">{activity.action}</p>
                                    <p className="text-xs text-gray-400">
                                        {formatDistanceToNow(new Date(activity.created_at), {
                                            addSuffix: true,
                                            locale: id
                                        })}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
