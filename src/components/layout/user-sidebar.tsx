'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    PieChart,
    Settings,
    LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function UserSidebar() {
    const pathname = usePathname();

    const navItems = [
        { href: '/user', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/user/profit', label: 'Pembagian Laba', icon: PieChart },
        { href: '/user/settings', label: 'Profil & Keamanan', icon: Settings },
    ];

    return (
        <aside className="bg-white hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-gray-100 shadow-sm z-20">
            {/* Logo */}
            <div className="h-20 flex items-center px-8">
                <img
                    src="/images/1000075381-removebg-preview.png"
                    alt="Logo Forbis"
                    className="h-12 w-auto object-contain"
                />
                <div className="ml-3 flex flex-col">
                    <span className="font-bold text-lg text-gray-800 tracking-tight leading-none">Forbis</span>
                    <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Cimanggung</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link key={href} href={href}>
                            <div
                                className={cn(
                                    "flex items-center px-4 py-3 rounded-2xl transition-all duration-200 group text-sm font-medium",
                                    isActive
                                        ? "text-primary bg-indigo-50"
                                        : "text-gray-500 hover:text-primary hover:bg-gray-50"
                                )}
                            >
                                <Icon className={cn("h-[18px] w-[18px] mr-3 transition-colors", isActive ? "text-primary" : "text-gray-400 group-hover:text-primary")} />
                                {label}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-100">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl"
                    onClick={async () => {
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        window.location.href = '/login';
                    }}
                >
                    <LogOut className="h-[18px] w-[18px] mr-3" />
                    Keluar
                </Button>
            </div>
        </aside>
    );
}
