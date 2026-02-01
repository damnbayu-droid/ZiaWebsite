'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingBag,
    FileText,
    BarChart3,
    Activity,
    Info,
    Settings,
    LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
    { title: 'Overview', href: '/admin', icon: LayoutDashboard },
    { title: 'User Management', href: '/admin/users', icon: Users },
    { title: 'Reports (Logs)', href: '/admin/reports', icon: BarChart3 },
    { title: 'Verifikasi User', href: '/admin/system', icon: Activity },
]

export function AdminSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 bg-white border-r min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-20">
            {/* Header */}
            <div className="h-16 flex items-center px-6 border-b">
                <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                    Z
                </div>
                <div>
                    <h1 className="font-bold text-gray-900 leading-none">Zia Admin</h1>
                    <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Control Panel</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-pink-50 text-pink-700"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-pink-600" : "text-gray-400")} />
                            {item.title}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 truncate">Administrator</p>
                        <p className="text-xs text-green-600 truncate flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Verified
                        </p>
                    </div>
                </div>
                <a
                    href="/profile"
                    className="flex items-center gap-2 px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
                >
                    <LogOut className="w-4 h-4" />
                    Keluar Panel
                </a>
            </div>
        </aside>
    )
}
