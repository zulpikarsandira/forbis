'use client';

import Link from 'next/link';
import { Sidebar } from '@/components/layout/sidebar';
import { RightSidebar } from '@/components/layout/right-sidebar';
import { Button } from '@/components/ui/button';
import {
    Menu,
    PanelRightOpen,
    PanelRightClose,
    LayoutDashboard,
    Package,
    ShoppingCart,
    PieChart,
    LogOut,
    Rocket,
    Settings // Added Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // Import client

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    const pathname = usePathname();

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: Menu }, // Reusing Menu icon for placeholder or individual icons
        { href: '/dashboard/products', label: 'Data Barang', icon: Menu },
        { href: '/dashboard/sales', label: 'Entry Penjualan', icon: Menu },
        { href: '/dashboard/profit', label: 'Pembagian Laba', icon: Menu },
    ];

    // Check if we are on the main dashboard page
    const isDashboardPage = pathname === '/dashboard';

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            {/* Left Sidebar (Desktop) */}
            <Sidebar />

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 w-full bg-white z-50 border-b p-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <img
                        src="/images/1000075381-removebg-preview.png"
                        alt="Logo Forbis"
                        className="h-10 w-auto object-contain"
                    />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600">
                    <Menu className="h-6 w-6" />
                </Button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <div
                        className="w-[280px] h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out translate-x-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b flex justify-between items-center bg-white">
                            <div className="flex items-center gap-2">
                                <img
                                    src="/images/1000075381-removebg-preview.png"
                                    alt="Logo Forbis"
                                    className="h-10 w-auto object-contain"
                                />
                                <span className="font-bold text-xl text-gray-900 ml-1">Menu</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="rounded-full hover:bg-gray-100"
                            >
                                <PanelRightClose className="h-5 w-5 text-gray-500" />
                            </Button>
                        </div>

                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {[
                                { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                                { href: '/dashboard/products', label: 'Data Barang', icon: Package },
                                { href: '/dashboard/sales', label: 'Entry Penjualan', icon: ShoppingCart },
                                { href: '/dashboard/profit', label: 'Pembagian Laba', icon: PieChart },
                                { href: '/dashboard/settings', label: 'Pengaturan & Profil', icon: Settings }, // Added Profile
                            ].map(({ href, label, icon: Icon }) => {
                                const isActive = pathname === href;
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <div
                                            className={cn(
                                                "flex items-center px-4 py-3.5 rounded-2xl transition-all border border-transparent",
                                                isActive
                                                    ? "text-primary bg-indigo-50/80 border-indigo-100 font-semibold"
                                                    : "text-gray-600 hover:text-primary hover:bg-gray-50"
                                            )}
                                        >
                                            <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-primary" : "text-gray-400")} />
                                            {label}
                                        </div>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-6 border-t bg-gray-50/50">
                            <Button
                                variant="outline"
                                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 border-gray-200 rounded-2xl py-6"
                                onClick={async () => {
                                    const supabase = createClient();
                                    await supabase.auth.signOut();
                                    window.location.href = '/login';
                                }}
                            >
                                <LogOut className="h-5 w-5 mr-3" />
                                Keluar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

                {/* Right Sidebar Toggle Button (Visible only on Dashboard and when Sidebar is closed) */}
                {isDashboardPage && !isRightSidebarOpen && (
                    <div className="absolute top-6 right-6 z-30 hidden xl:block">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsRightSidebarOpen(true)}
                            className="bg-white shadow-sm hover:bg-gray-50"
                        >
                            <PanelRightOpen className="h-5 w-5 text-gray-600" />
                        </Button>
                    </div>
                )}


                <div className="flex-1 overflow-y-auto p-4 lg:p-8 pt-20 lg:pt-8 space-y-8">
                    {children}
                </div>
            </main>

            {/* Right Sidebar (Desktop - Only on Dashboard Page) */}
            {isDashboardPage && (
                <RightSidebar
                    isOpen={isRightSidebarOpen}
                    onClose={() => setIsRightSidebarOpen(false)}
                />
            )}
        </div>
    );
}
