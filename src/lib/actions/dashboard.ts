'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from "next/headers";

async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
                set() { },
                remove() { },
            },
        }
    )
}

const jakartaDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
const jakartaFirstDayOfMonth = () => jakartaDate().slice(0, 7) + '-01';
const jakartaSevenDaysAgo = () => {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    d.setDate(d.getDate() - 6);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
};

export async function getDashboardStats() {
    const supabase = await createSupabaseServerClient();
    const today = jakartaDate();
    const firstDayOfMonth = jakartaFirstDayOfMonth();

    // 1. Total Sales Today (exclude soft-deleted)
    const { data: salesTodayRaw } = await supabase
        .from('barang_laku')
        .select('total_harga, laba, is_deleted')
        .eq('tanggal', today);

    const salesToday = (salesTodayRaw || []).filter((d: any) => !d.is_deleted);
    const totalSalesToday = salesToday.reduce((sum: number, item: any) => sum + item.total_harga, 0);
    const totalProfitToday = salesToday.reduce((sum: number, item: any) => sum + item.laba, 0);

    // 2. Total Sales This Month (exclude soft-deleted)
    const { data: salesMonthRaw } = await supabase
        .from('barang_laku')
        .select('total_harga, laba, is_deleted')
        .gte('tanggal', firstDayOfMonth);

    const salesMonth = (salesMonthRaw || []).filter((d: any) => !d.is_deleted);
    const totalSalesMonth = salesMonth.reduce((sum: number, item: any) => sum + item.total_harga, 0);
    const totalProfitMonth = salesMonth.reduce((sum: number, item: any) => sum + item.laba, 0);

    // 3. Low Stock Items (Top 5)
    const { data: lowStockItems, count: lowStockCount } = await supabase
        .from('barang')
        .select('*', { count: 'exact' })
        .lte('jumlah', 5)
        .order('jumlah', { ascending: true })
        .limit(5);

    // 4. Total Products
    const { count: totalProducts } = await supabase
        .from('barang')
        .select('*', { count: 'exact', head: true });

    // 5. Recent Activity (Last 5 Sales, exclude soft-deleted)
    const { data: recentSalesRaw } = await supabase
        .from('barang_laku')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20); // fetch more then filter

    const recentSales = (recentSalesRaw || [])
        .filter((d: any) => !d.is_deleted)
        .slice(0, 5);

    // 6. Sales Trend (Last 7 Days), exclude soft-deleted
    const dateStr = jakartaSevenDaysAgo();
    const { data: trendDataRaw } = await supabase
        .from('barang_laku')
        .select('tanggal, total_harga, is_deleted')
        .gte('tanggal', dateStr)
        .order('tanggal', { ascending: true });

    const trendData = (trendDataRaw || []).filter((d: any) => !d.is_deleted);

    // Group by date for last 7 days (using Jakarta dates)
    const trendMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
        const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
        d.setDate(d.getDate() - 6 + i);
        trendMap.set(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d), 0);
    }

    trendData.forEach((item: any) => {
        const current = trendMap.get(item.tanggal) || 0;
        trendMap.set(item.tanggal, current + item.total_harga);
    });

    const chartLabels = Array.from(trendMap.keys());
    const chartValues = Array.from(trendMap.values());

    return {
        totalSalesToday,
        totalProfitToday,
        totalSalesMonth,
        totalProfitMonth,
        lowStockCount: lowStockCount || 0,
        lowStockItems: lowStockItems || [],
        totalProducts: totalProducts || 0,
        recentSales,
        chartData: { labels: chartLabels, values: chartValues }
    };
}
