'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    PieChart,
    Settings,
    LogOut,
    Menu,
    Rocket,
    DatabaseBackup
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme-toggle';

export function Sidebar() {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/products', label: 'Data Barang', icon: Package },
        { href: '/dashboard/sales', label: 'Entry Penjualan', icon: ShoppingCart },
        { href: '/dashboard/profit', label: 'Pembagian Laba', icon: PieChart },
        { href: '/dashboard/backup', label: 'Backup & Restore', icon: DatabaseBackup },
    ];

    return (
        <aside className="bg-sidebar hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-sidebar-border shadow-sm z-20">
            {/* Logo */}
            <div className="h-20 flex items-center px-8">
                <img
                    src="/images/1000075381-removebg-preview.png"
                    alt="Logo Forbis"
                    className="h-12 w-auto object-contain"
                />
                <div className="ml-3 flex flex-col">
                    <span className="font-bold text-lg text-sidebar-foreground tracking-tight leading-none">Forbis</span>
                    <span className="text-[10px] text-sidebar-foreground/50 font-medium tracking-wider uppercase">Cimanggung</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {[
                    ...navItems,
                    { href: '/dashboard/settings', label: 'Pengaturan & Profil', icon: Settings } // Added Profile
                ].map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link key={href} href={href}>
                            <div
                                className={cn(
                                    "flex items-center px-4 py-3 rounded-2xl transition-all duration-200 group text-sm font-medium",
                                    isActive
                                        ? "text-sidebar-primary-foreground bg-sidebar-primary"
                                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                                )}
                            >
                                <Icon className={cn("h-[18px] w-[18px] mr-3 transition-colors", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-primary-foreground")} />
                                {label}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Theme Toggle & Logout Button */}
            <div className="p-4 space-y-4 border-t border-sidebar-border">
                <div className="px-4">
                    <ThemeToggle />
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl"
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
