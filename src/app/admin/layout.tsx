import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Zia Admin',
    description: 'Administration Dashboard',
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Simple Admin Header */}
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center text-white font-bold">Z</div>
                    <h1 className="font-bold text-gray-900">Zia Admin</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 hidden md:inline">Administrator Access</span>
                    <a href="/profile" className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        Keluar Panel
                    </a>
                </div>
            </header>
            <main className="flex-1 container mx-auto p-6 max-w-5xl">
                {children}
            </main>
        </div>
    )
}
