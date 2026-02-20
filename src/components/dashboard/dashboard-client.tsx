'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    ShoppingCart, TrendingUp, RefreshCw,
    Users, Briefcase, MoreHorizontal, FileText,
    Calendar, ArrowUpRight, History, AlertTriangle
} from 'lucide-react';
import { getDashboardStats } from '@/lib/actions/dashboard';
import { createClient } from '@/lib/supabase/client';
import { PurpleStatCard } from '@/components/dashboard/purple-stat-card';
import { SimpleStatCard } from '@/components/dashboard/simple-stat-card';
import { DashboardBarChart } from '@/components/dashboard/bar-chart';
import { DashboardCombinedTable } from '@/components/dashboard/combined-table';
import { Skeleton } from '@/components/ui/skeleton';

type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;

const formatIDR = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export function DashboardClient() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
        setLastUpdated(new Date());
        setLoading(false);
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Supabase Realtime — re-fetch on any change to barang_laku or barang
    useEffect(() => {
        const supabase = createClient();

        const channel = supabase
            .channel('dashboard_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'barang_laku' }, fetchStats)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'barang' }, fetchStats)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchStats]);

    return (
        <div className="space-y-8">
            {/* Banner */}
            <div className="w-full relative rounded-[2rem] overflow-hidden shadow-sm border border-border group h-[180px] md:h-[280px]">
                <Image
                    src="/images/baner well.png"
                    alt="Dashboard Aplikasi Penjualan Forbis UMKM Cimanggung"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                />
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Statistik Penjualan</h1>
                <div className="flex items-center gap-3">
                    {lastUpdated && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            Update: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    )}
                    <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-xl border border-border shadow-sm w-fit">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-semibold text-muted-foreground">Live Data</span>
                    </div>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    {loading || !stats ? (
                        <Skeleton className="h-[200px] w-full rounded-2xl" />
                    ) : (
                        <PurpleStatCard
                            title="Total Penjualan"
                            value={formatIDR(stats.totalSalesToday)}
                            subtitle="Penjualan Hari Ini"
                            className="h-full min-h-[200px]"
                        />
                    )}
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loading || !stats ? (
                        <>
                            <Skeleton className="h-[100px] w-full rounded-2xl" />
                            <Skeleton className="h-[100px] w-full rounded-2xl" />
                        </>
                    ) : (
                        <>
                            <SimpleStatCard
                                icon={ShoppingCart}
                                value={stats.recentSales.length > 0
                                    ? stats.totalSalesToday > 0
                                        ? String(stats.recentSales.filter((s: any) =>
                                            s.tanggal === new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
                                        ).length)
                                        : '0'
                                    : '0'
                                }
                                label="Transaksi Hari Ini"
                                colorClass="bg-indigo-500"
                            />
                            <SimpleStatCard
                                icon={TrendingUp}
                                value={formatIDR(stats.totalProfitMonth)}
                                label="Laba Bulan Ini"
                                colorClass="bg-cyan-500"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Chart */}
            <div className="bg-card rounded-[2.5rem] p-8 shadow-sm border border-border">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-foreground">Analisis Penjualan</h3>
                </div>
                <div className="h-[300px] w-full">
                    {loading || !stats ? (
                        <Skeleton className="h-full w-full rounded-xl" />
                    ) : (
                        <DashboardBarChart
                            labels={stats.chartData.labels}
                            values={stats.chartData.values}
                        />
                    )}
                </div>
            </div>

            {/* Recent Sales + Low Stock Table */}
            {loading || !stats ? (
                <Skeleton className="h-[300px] w-full rounded-2xl" />
            ) : (
                <DashboardCombinedTable
                    lowStockItems={stats.lowStockItems}
                    recentSales={stats.recentSales}
                />
            )}
        </div>
    );
}
