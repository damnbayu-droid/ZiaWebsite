import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar (Desktop) */}
            <div className="hidden md:block w-64 flex-shrink-0">
                <AdminSidebar />
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header (TODO: Add Sheet/Hamburger) */}
                <header className="md:hidden bg-white border-b h-16 flex items-center px-4 sticky top-0 z-10">
                    <span className="font-bold">Zia Admin</span>
                </header>

                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
