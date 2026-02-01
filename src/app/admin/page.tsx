'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CreditCard, DollarSign, Activity, HardDrive, Database, Server } from 'lucide-react'

export default function AdminOverviewPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">System Overview</h2>
                <p className="text-gray-500">Realtime monitoring and platform statistics.</p>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1</div>
                        <p className="text-xs text-muted-foreground">Registered Accounts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1</div>
                        <p className="text-xs text-muted-foreground">Online Users</p>
                    </CardContent>
                </Card>
            </div>

            {/* System Health */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>System Health Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <Database className="w-5 h-5 text-green-600" />
                                    <div>
                                        <p className="font-medium">Supabase Database</p>
                                        <p className="text-xs text-gray-500">PostgreSQL 15.1</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">OPERATIONAL</span>
                            </div>
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <HardDrive className="w-5 h-5 text-green-600" />
                                    <div>
                                        <p className="font-medium">Storage Buckets</p>
                                        <p className="text-xs text-gray-500">Avatars, Materials</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">OPERATIONAL</span>
                            </div>
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <Server className="w-5 h-5 text-green-600" />
                                    <div>
                                        <p className="font-medium">OpenAI Gateway</p>
                                        <p className="text-xs text-gray-500">gpt-4-turbo via OpenClaw</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">OPERATIONAL</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Static mock data until we have real logs */}
                            <div className="border-l-2 border-blue-500 pl-4 py-1">
                                <p className="text-sm font-medium">System Started</p>
                                <p className="text-xs text-gray-500">Today, 5 mins ago</p>
                            </div>
                            <div className="border-l-2 border-green-500 pl-4 py-1">
                                <p className="text-sm font-medium">New User Registration</p>
                                <p className="text-xs text-gray-500">Today, 1 hour ago</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
