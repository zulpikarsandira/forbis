'use client';

import { Calendar } from "@/components/ui/calendar";
import { useState, useEffect } from "react";
import { Bell, X, Loader2, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/lib/actions/dashboard";
import Link from "next/link";

interface RightSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchActivities() {
            try {
                const stats = await getDashboardStats();
                setActivities(stats.recentSales);
            } catch (err) {
                console.error("Failed to fetch activities:", err);
            } finally {
                setLoading(false);
            }
        }

        if (isOpen) {
            fetchActivities();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const currentMonth = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date || new Date());

    return (
        <aside className="bg-white hidden xl:flex flex-col w-80 h-screen sticky top-0 border-l border-gray-100 p-6 z-20 transition-all duration-300">
            {/* Header / User Profile */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full relative text-gray-400 hover:text-primary hover:bg-indigo-50">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <Link href="/dashboard/settings" className="flex items-center gap-3 group">
                    <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">Admin</p>
                        <p className="text-xs text-gray-500">Super User</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm group-hover:border-indigo-100 transition-all">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
                    </div>
                </Link>
            </div>

            {/* Calendar Widget */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 capitalize">{currentMonth}</h3>
                </div>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-3xl border-0 shadow-none p-0"
                    classNames={{
                        head_cell: "text-gray-400 font-normal text-[0.8rem] w-8",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
                        day: "h-8 w-8 p-0 font-medium aria-selected:opacity-100 hover:bg-gray-100 rounded-full",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md shadow-indigo-200",
                        day_today: "bg-gray-100 text-gray-900",
                    }}
                />
            </div>

            {/* Recent Activity / Scheduled */}
            <div className="flex-1 flex flex-col min-h-0">
                <h3 className="font-bold text-gray-900 mb-4">Aktivitas Terbaru</h3>
                <div className="space-y-4 overflow-y-auto pr-2 flex-1 scrollbar-hide">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : activities.length > 0 ? (
                        activities.map((item, i) => (
                            <div key={item.id || i} className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-100">
                                <div className="h-10 w-10 rounded-full overflow-hidden shrink-0">
                                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.nama}`} alt={item.nama} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-gray-900 truncate">{item.nama}</h4>
                                    <p className="text-xs text-gray-500">{item.jumlah} items • {item.kategori}</p>
                                </div>
                                <div className="h-8 px-2 flex items-center justify-center rounded-lg text-[10px] font-bold bg-white text-gray-500 border shadow-sm shrink-0">
                                    {new Date(item.created_at || item.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-8">Belum ada aktivitas.</p>
                    )}
                </div>
            </div>
        </aside>
    );
}
