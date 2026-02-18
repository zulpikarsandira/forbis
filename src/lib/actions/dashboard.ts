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
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                },
                remove(name: string, options: CookieOptions) {
                },
            },
        }
    )
}

export async function getDashboardStats() {
    const supabase = await createSupabaseServerClient();
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // 1. Total Sales Today
    const { data: salesToday } = await supabase
        .from('barang_laku')
        .select('total_harga, laba')
        .eq('tanggal', today);

    const totalSalesToday = salesToday?.reduce((sum, item) => sum + item.total_harga, 0) || 0;
    const totalProfitToday = salesToday?.reduce((sum, item) => sum + item.laba, 0) || 0;

    // 2. Total Sales This Month
    const { data: salesMonth } = await supabase
        .from('barang_laku')
        .select('total_harga, laba')
        .gte('tanggal', firstDayOfMonth);

    const totalSalesMonth = salesMonth?.reduce((sum, item) => sum + item.total_harga, 0) || 0;
    const totalProfitMonth = salesMonth?.reduce((sum, item) => sum + item.laba, 0) || 0;

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

    // 5. Recent Activity (Last 5 Sales)
    const { data: recentSales } = await supabase
        .from('barang_laku')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    // 6. Sales Trend (Last 7 Days)
    // Simplify: Get sales for last 7 days. 
    // Ideally use a recursive CTE or group by in SQL, but for now JS aggregation
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: trendData } = await supabase
        .from('barang_laku')
        .select('tanggal, total_harga')
        .gte('tanggal', dateStr)
        .order('tanggal', { ascending: true });

    // Group by date
    const trendMap = new Map<string, number>();
    // Initialize map
    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        trendMap.set(d.toISOString().split('T')[0], 0);
    }

    trendData?.forEach(item => {
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
        recentSales: recentSales || [],
        chartData: {
            labels: chartLabels,
            values: chartValues
        }
    };
}
