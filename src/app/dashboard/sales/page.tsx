import { getSales } from '@/lib/actions/sales';
import { SalesTableClient } from '@/components/sales/sales-table-client';

export default async function SalesPage() {
    const { data: sales } = await getSales();

    const salesDapur = sales?.filter(s => s.kategori === 'Dapur') || [];
    const salesWarung = sales?.filter(s => s.kategori === 'Warung' || !s.kategori) || [];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Entry Penjualan</h1>
                    <p className="text-muted-foreground">Input transaksi harian dan lihat riwayat penjualan.</p>
                </div>
                <div className="text-right text-xs text-gray-400">
                    Menampilkan data periode ini
                </div>
            </div>

            <div className="space-y-12">
                <SalesTableClient data={salesDapur} title="Penjualan Dapur" variant="orange" kategori="Dapur" />
                <SalesTableClient data={salesWarung} title="Penjualan Warung atau Umum" variant="blue" kategori="Warung" />
            </div>
        </div>
    );
}
