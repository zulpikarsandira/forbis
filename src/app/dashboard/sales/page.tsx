'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SalesTableClient } from '@/components/sales/sales-table-client';
import { SalesHistory } from '@/components/sales/sales-history';
import { getTodaySales, type Sale } from '@/lib/actions/sales';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, ShoppingCart, RefreshCw } from 'lucide-react';

export default function SalesPage() {
    const [todaySales, setTodaySales] = useState<Sale[]>([]);
    const [today, setToday] = useState('');
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const lastDateRef = useRef<string>('');

    const fetchTodayData = useCallback(async () => {
        setLoading(true);
        const result = await getTodaySales();
        setTodaySales(result.data || []);
        setToday(result.today || '');
        lastDateRef.current = result.today || '';
        setLastUpdated(new Date());
        setLoading(false);
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchTodayData();
    }, [fetchTodayData]);

    // Supabase Realtime subscription
    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel('barang_laku_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'barang_laku' },
                () => {
                    // Re-fetch today's data when any change happens
                    fetchTodayData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchTodayData]);

    // Auto date-change detection every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const currentDate = new Date().toLocaleDateString('en-CA');
            if (lastDateRef.current && currentDate !== lastDateRef.current) {
                // Date has changed (midnight passed) → reset/refresh
                fetchTodayData();
            }
        }, 60 * 1000);

        return () => clearInterval(interval);
    }, [fetchTodayData]);

    const salesDapur = todaySales.filter(s => s.kategori === 'Dapur');
    const salesWarung = todaySales.filter(s => s.kategori === 'Warung' || !s.kategori);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Entry Penjualan</h1>
                    <p className="text-muted-foreground">Input transaksi harian dan lihat riwayat penjualan.</p>
                </div>
                {lastUpdated && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <RefreshCw className="h-3 w-3" />
                        <span>Live · {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="today">
                <TabsList className="bg-muted p-1 rounded-2xl border border-border">
                    <TabsTrigger value="today" className="rounded-xl flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
                        <ShoppingCart className="h-4 w-4" />
                        Entry Hari Ini
                        {todaySales.length > 0 && (
                            <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {todaySales.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
                        <History className="h-4 w-4" />
                        History
                    </TabsTrigger>
                </TabsList>

                {/* Today Tab */}
                <TabsContent value="today" className="space-y-12 mt-6">
                    {today && (
                        <p className="text-sm text-muted-foreground mb-4">
                            Menampilkan data hari ini: <strong className="text-foreground">{today}</strong>
                        </p>
                    )}
                    <SalesTableClient data={salesDapur} title="Penjualan Dapur" variant="orange" kategori="Dapur" loading={loading} />
                    <SalesTableClient data={salesWarung} title="Penjualan Warung atau Umum" variant="blue" kategori="Warung" loading={loading} />
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="mt-6">
                    <SalesHistory />
                </TabsContent>
            </Tabs>
        </div>
    );
}
