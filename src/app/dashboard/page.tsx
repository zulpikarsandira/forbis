import Link from 'next/link';
import Image from 'next/image';

import { getDashboardStats } from '@/lib/actions/dashboard';
import { PurpleStatCard } from '@/components/dashboard/purple-stat-card';
import { SimpleStatCard } from '@/components/dashboard/simple-stat-card';
import { DashboardBarChart } from '@/components/dashboard/bar-chart';
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Briefcase,
    MoreHorizontal,
    FileText,
    Calendar,
    ArrowUpRight,
    History,
    AlertTriangle,
    ShoppingCart,
    TrendingUp
} from 'lucide-react';
import { DashboardCombinedTable } from '@/components/dashboard/combined-table';

export default async function DashboardPage() {
    const stats = await getDashboardStats();

    // Format currency
    const formatIDR = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

    return (
        <div className="space-y-8">
            {/* Banner Section */}
            <div className="w-full relative rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 group">
                <div className="w-full relative" style={{ aspectRatio: '1500/1000' }}>
                    <Image
                        src="/images/dashboard aplikasi forbis umkm cimanggung (1350 x 1080 px) (1500 x 1000 px).png"
                        alt="Dashboard Aplikasi Penjualan Forbis UMKM Cimanggung"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                    />
                </div>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Statistik Penjualan</h1>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border shadow-sm w-fit">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-semibold text-gray-700">Live Data</span>
                </div>
            </div>

            {/* Top Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <PurpleStatCard
                        title="Total Penjualan"
                        value={formatIDR(stats.totalSalesToday)}
                        subtitle="Penjualan Hari Ini"
                        className="h-full min-h-[200px]"
                    />
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SimpleStatCard
                        icon={ShoppingCart}
                        value={stats.recentSales.length.toString()}
                        label="Transaksi Hari Ini"
                        colorClass="bg-indigo-500"
                    />
                    <SimpleStatCard
                        icon={TrendingUp}
                        value={formatIDR(stats.totalProfitMonth)}
                        label="Laba Bulan Ini"
                        colorClass="bg-cyan-500"
                    />
                </div>
            </div>

            {/* Middle Section: Chart */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-gray-900">Analisis Penjualan</h3>
                </div>
                <div className="h-[300px] w-full">
                    <DashboardBarChart
                        labels={stats.chartData.labels}
                        values={stats.chartData.values}
                    />
                </div>
            </div>

            {/* Bottom Section: Combined Table */}
            <DashboardCombinedTable
                lowStockItems={stats.lowStockItems}
                recentSales={stats.recentSales}
            />
        </div>
    );
}
