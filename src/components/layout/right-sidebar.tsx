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
        <aside className="bg-card hidden xl:flex flex-col w-80 h-screen sticky top-0 border-l border-border p-6 z-20 transition-all duration-300">
            {/* Logo Section */}
            <div className="flex flex-col items-center justify-center mb-8">
                <img
                    src="/images/1000075381-removebg-preview.png"
                    alt="Logo Forbis"
                    className="h-20 w-auto object-contain"
                />
                <div className="mt-3 text-center">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight">Koperasi Forbis</h2>
                    <p className="text-[10px] text-gray-400 font-medium">Cimanggung</p>
                </div>
            </div>

            {/* Header / User Profile */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full relative text-muted-foreground hover:text-primary hover:bg-muted">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-card"></span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <Link href="/dashboard/settings" className="flex items-center gap-3 group">
                    <div className="text-right">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Admin</p>
                        <p className="text-xs text-muted-foreground">Super User</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-muted overflow-hidden border-2 border-border shadow-sm group-hover:border-primary/50 transition-all">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
                    </div>
                </Link>
            </div>

            {/* Calendar Widget */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground capitalize">{currentMonth}</h3>
                </div>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-3xl border-0 shadow-none p-0"
                    classNames={{
                        head_cell: "text-muted-foreground font-normal text-[0.8rem] w-8",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
                        day: "h-8 w-8 p-0 font-medium aria-selected:opacity-100 hover:bg-muted rounded-full",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md shadow-primary/20",
                        day_today: "bg-muted text-foreground",
                    }}
                />
            </div>

            {/* Recent Activity / Scheduled */}
            <div className="flex-1 flex flex-col min-h-0">
                <h3 className="font-bold text-foreground mb-4">Aktivitas Terbaru</h3>
                <div className="space-y-4 overflow-y-auto pr-2 flex-1 h-[300px] xl:h-[calc(100vh-450px)]">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : activities.length > 0 ? (
                        activities.map((item, i) => (
                            <div key={item.id || i} className="flex items-center gap-4 p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 hover:shadow-sm transition-all border border-transparent hover:border-border">
                                <div className="h-10 w-10 rounded-full overflow-hidden shrink-0">
                                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.nama}`} alt={item.nama} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-foreground truncate">{item.nama}</h4>
                                    <p className="text-xs text-muted-foreground">{item.jumlah} items • {item.kategori}</p>
                                </div>
                                <div className="h-8 px-2 flex items-center justify-center rounded-lg text-[10px] font-bold bg-card text-muted-foreground border border-border shadow-sm shrink-0">
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
