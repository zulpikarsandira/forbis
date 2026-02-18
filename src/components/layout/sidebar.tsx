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
    Rocket
} from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/products', label: 'Data Barang', icon: Package },
        { href: '/dashboard/sales', label: 'Entry Penjualan', icon: ShoppingCart },
        { href: '/dashboard/profit', label: 'Pembagian Laba', icon: PieChart },
    ];

    return (
        <aside className="bg-white hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-gray-100 shadow-sm z-20">
            {/* Logo */}
            <div className="h-20 flex items-center px-8">
                <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6"
                    >
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </div>
                <span className="ml-3 font-bold text-xl text-gray-800 tracking-tight">Koperasi</span>
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

            {/* Upgrade Card (Placeholder) */}
            <div className="p-4 mx-4 mb-6 bg-indigo-50 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 h-16 w-16 bg-indigo-100 rounded-full opacity-50 blur-xl"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                        <Rocket className="h-5 w-5 text-indigo-500" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">Versi Pro</h4>
                    <p className="text-xs text-gray-500 mt-1 mb-3">Dapatkan fitur lebih lengkap</p>
                    <Button className="w-full bg-gradient-primary text-white rounded-xl h-8 text-xs shadow-md shadow-indigo-200">
                        Upgrade
                    </Button>
                </div>
            </div>
        </aside>
    );
}
