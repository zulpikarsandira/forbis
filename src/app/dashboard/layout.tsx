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
    Settings,
    DatabaseBackup
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
        <div className="min-h-screen bg-background flex font-sans text-foreground transition-colors duration-300">
            {/* Left Sidebar (Desktop) */}
            <Sidebar />

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 w-full bg-card z-50 border-b border-border p-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <img
                        src="/images/1000075381-removebg-preview.png"
                        alt="Logo Forbis"
                        className="h-10 w-auto object-contain"
                    />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-muted-foreground">
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
                        className="w-[280px] h-full bg-card shadow-2xl flex flex-col transition-transform duration-300 ease-out translate-x-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-border flex justify-between items-center bg-card">
                            <div className="flex items-center gap-2">
                                <img
                                    src="/images/1000075381-removebg-preview.png"
                                    alt="Logo Forbis"
                                    className="h-10 w-auto object-contain"
                                />
                                <span className="font-bold text-xl text-foreground ml-1">Menu</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="rounded-full hover:bg-muted"
                            >
                                <PanelRightClose className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>

                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {[
                                { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                                { href: '/dashboard/products', label: 'Data Barang', icon: Package },
                                { href: '/dashboard/sales', label: 'Entry Penjualan', icon: ShoppingCart },
                                { href: '/dashboard/profit', label: 'Pembagian Laba', icon: PieChart },
                                { href: '/dashboard/backup', label: 'Backup & Restore', icon: DatabaseBackup },
                                { href: '/dashboard/settings', label: 'Pengaturan & Profil', icon: Settings },
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
                                                    ? "text-primary bg-primary/10 border-primary/20 font-semibold"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                            )}
                                        >
                                            <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-primary" : "text-muted-foreground")} />
                                            {label}
                                        </div>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-6 border-t border-border bg-muted/30">
                            <Button
                                variant="outline"
                                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-border rounded-2xl py-6"
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
                            className="bg-card shadow-sm hover:bg-muted border-border"
                        >
                            <PanelRightOpen className="h-5 w-5 text-muted-foreground" />
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
