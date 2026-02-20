'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSalesByDate, getHistoryDates, type Sale } from '@/lib/actions/sales';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, Download, FileText, History, ChevronDown, ReceiptText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export function SalesHistory() {
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        getHistoryDates().then(res => {
            setDates(res.dates);
            if (res.dates.length > 0) setSelectedDate(res.dates[0]);
        });
    }, []);

    useEffect(() => {
        if (!selectedDate) return;
        setLoading(true);
        getSalesByDate(selectedDate).then(res => {
            setSales(res.data || []);
            setLoading(false);
        });
    }, [selectedDate]);

    const salesDapur = sales.filter(s => s.kategori === 'Dapur');
    const salesWarung = sales.filter(s => s.kategori === 'Warung' || !s.kategori);
    const totalLaba = sales.reduce((sum, s) => sum + s.laba, 0);
    const totalPenjualan = sales.reduce((sum, s) => sum + s.total_harga, 0);

    const exportExcel = async () => {
        setExporting(true);
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet(`Penjualan ${selectedDate}`);
        ws.columns = [
            { header: 'Tanggal', key: 'tanggal', width: 14 },
            { header: 'Nama Barang', key: 'nama', width: 25 },
            { header: 'Kategori', key: 'kategori', width: 12 },
            { header: 'Jumlah', key: 'jumlah', width: 10 },
            { header: 'Total Harga', key: 'total_harga', width: 18 },
            { header: 'Laba', key: 'laba', width: 16 },
        ];
        ws.getRow(1).font = { bold: true };
        sales.forEach(s => ws.addRow(s));
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Penjualan_${selectedDate}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        setExporting(false);
    };

    const exportPDF = () => {
        setExporting(true);
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text(`Laporan Penjualan - ${selectedDate}`, 14, 16);
        autoTable(doc, {
            startY: 22,
            head: [['Tanggal', 'Nama Barang', 'Kategori', 'Jumlah', 'Total Harga', 'Laba']],
            body: sales.map(s => [s.tanggal, s.nama, s.kategori, s.jumlah,
            formatRupiah(s.total_harga), formatRupiah(s.laba)]),
            styles: { fontSize: 8 },
        });
        doc.save(`Penjualan_${selectedDate}.pdf`);
        setExporting(false);
    };

    if (dates.length === 0) {
        return (
            <div className="rounded-2xl border bg-white shadow-sm p-12 text-center text-muted-foreground">
                <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Belum ada data history.</p>
                <p className="text-sm mt-1">Data hari-hari sebelumnya akan muncul di sini.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Pilih Tanggal:</span>
                </div>
                <div className="flex flex-wrap gap-2 flex-1">
                    {dates.map(date => (
                        <button
                            key={date}
                            onClick={() => setSelectedDate(date)}
                            className={cn(
                                'px-3 py-1.5 text-sm rounded-xl border transition-all font-medium',
                                selectedDate === date
                                    ? 'bg-primary text-white border-primary shadow-md'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                            )}
                        >
                            {date}
                        </button>
                    ))}
                </div>

                {selectedDate && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2 rounded-xl" disabled={exporting}>
                                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                Export
                                <ChevronDown className="h-3 w-3 opacity-60" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={exportExcel}>
                                <FileText className="h-4 w-4 mr-2 text-green-600" />
                                Export Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={exportPDF}>
                                <FileText className="h-4 w-4 mr-2 text-red-600" />
                                Export PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Summary Cards */}
            {selectedDate && !loading && sales.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Transaksi', value: `${sales.length} item`, color: 'text-blue-600' },
                        { label: 'Total Penjualan', value: formatRupiah(totalPenjualan), color: 'text-gray-900' },
                        { label: 'Total Laba', value: formatRupiah(totalLaba), color: 'text-green-600' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl border bg-white p-4 shadow-sm text-center">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className={cn('font-bold text-lg mt-1 truncate', color)}>{value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table className="min-w-[600px]">
                            <TableHeader className="bg-gray-100/50">
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Nama Barang</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead className="text-center">Jumlah</TableHead>
                                    <TableHead className="text-right">Total Harga</TableHead>
                                    <TableHead className="text-right">Laba</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.length > 0 ? sales.map(sale => (
                                    <TableRow key={sale.id} className="hover:bg-gray-50/50">
                                        <TableCell className="text-gray-500 whitespace-nowrap">{sale.tanggal}</TableCell>
                                        <TableCell className="font-semibold">{sale.nama}</TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                'px-2 py-0.5 rounded-full text-xs font-bold',
                                                sale.kategori === 'Dapur' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                            )}>{sale.kategori}</span>
                                        </TableCell>
                                        <TableCell className="text-center">{sale.jumlah}</TableCell>
                                        <TableCell className="text-right font-mono font-bold">{formatRupiah(sale.total_harga)}</TableCell>
                                        <TableCell className="text-right text-green-600 font-mono font-medium">+{formatRupiah(sale.laba)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                                            <div className="flex flex-col items-center gap-2">
                                                <ReceiptText className="h-8 w-8 opacity-20" />
                                                <span>Tidak ada data untuk tanggal ini.</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
