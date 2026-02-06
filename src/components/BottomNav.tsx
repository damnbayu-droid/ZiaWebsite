'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Book, FileText, User, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { href: '/', label: 'Beranda', icon: Home },
        { href: '/subjects', label: 'Pelajaran', icon: Book },
        { href: '/arena', label: 'Arena', icon: Trophy },
        { href: '/notes', label: 'Catatan', icon: FileText },
        { href: '/profile', label: 'Profil', icon: User },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50">
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={`Pindah ke halaman ${item.label}`}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                isActive ? "text-pink-600" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <item.icon className={cn("w-6 h-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
