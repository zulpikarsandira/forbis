'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { RightSidebar } from '@/components/layout/right-sidebar';
import { Button } from '@/components/ui/button';
import { Menu, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    const pathname = usePathname();

    // Check if we are on the main dashboard page
    const isDashboardPage = pathname === '/dashboard';

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            {/* Left Sidebar (Desktop) */}
            <Sidebar />

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 w-full bg-white z-50 border-b p-4 flex justify-between items-center">
                <span className="font-bold text-lg">Koperasi Forbis</span>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    <Menu />
                </Button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="w-64 h-full bg-white p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-4 font-bold">Menu</div>
                        {/* Mobile Nav logic same as sidebar... */}
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
