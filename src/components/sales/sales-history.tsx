'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
    CalendarIcon,
    Search,
    ChevronLeft,
    ChevronRight,
    FileDown,
    Trash2,
    RefreshCcw,
    FileSpreadsheet,
    FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { deleteHistorySale, restoreHistorySale, getSalesByDate, type Sale } from '@/lib/actions/sales';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyExcelHeader, applyPDFHeader, getLogoBase64 } from '@/lib/export-utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2 } from 'lucide-react';

// Types
export type ExtendedSale = Sale & {
    is_deleted?: boolean;
};

interface SalesHistoryProps {
    sales?: ExtendedSale[];
}

async function exportExcelForKategori(data: Sale[], kategori: string, date: string, variant: 'orange' | 'blue') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Laporan ${kategori}`);
    const logoBase64 = await getLogoBase64();

    const columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Waktu', key: 'waktu', width: 10 },
        { header: 'Nama Pelanggan', key: 'pelanggan', width: 25 },
        { header: 'Total Belanja', key: 'total', width: 20 },
        { header: 'Kategori', key: 'kategori', width: 15 },
        { header: 'ID Transaksi', key: 'id', width: 15 },
    ];

    const startRow = applyExcelHeader(workbook, worksheet, `Laporan Penjualan`, columns, logoBase64);

    const headerRow = worksheet.getRow(startRow);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: variant === 'orange' ? 'FFF97316' : 'FF2563EB' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    data.forEach((sale, index) => {
        const row = worksheet.addRow({
            no: index + 1,
            waktu: format(new Date(sale.created_at), 'HH:mm'),
            pelanggan: sale.nama,
            total: sale.total_harga,
            kategori: sale.kategori,
            id: sale.id
        });

        row.eachCell((cell, colNumber) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (colNumber === 4) {
                cell.numFmt = '#,##0';
                cell.alignment = { horizontal: 'right' };
            }
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Penjualan_${kategori}_${date}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
}

async function exportPDFForKategori(data: Sale[], kategori: string, date: string, variant: 'orange' | 'blue') {
    const doc = new jsPDF();
    const printDate = new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const printNumber = `INV-${Date.now().toString().slice(-6)}`;
    const logoBase64 = await getLogoBase64();

    const startY = applyPDFHeader(doc, `Laporan Penjualan`, logoBase64);
    const totalSum = data.reduce((acc, sale) => acc + sale.total_harga, 0)

    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`No. Cetak: ${printNumber}`, 15, startY);
    doc.text(`Tanggal Laporan: ${printDate}`, 15, startY + 5);

    autoTable(doc, {
        startY: startY + 10,
        head: [['No', 'Waktu', 'Nama Pelanggan', 'Total Belanja']],
        body: data.map((s, i) => [
            i + 1,
            format(new Date(s.created_at), 'HH:mm'),
            s.nama,
            new Intl.NumberFormat('id-ID').format(s.total_harga)
        ]),
        foot: [[
            { content: 'TOTAL KESELURUHAN', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0] } },
            { content: `Rp ${totalSum.toLocaleString('id-ID')}`, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0] } }
        ]],
        theme: 'grid',
        headStyles: {
            fillColor: variant === 'orange' ? [249, 115, 22] : [37, 99, 235],
        },
        styles: { fontSize: 8, lineColor: [200, 200, 200], lineWidth: 0.1 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || startY + 50
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Terima Kasih Atas Kunjungan Anda', 105, finalY + 15, { align: 'center' })

    doc.save(`Laporan_Penjualan_${kategori}_${date}.pdf`);
}

export function SalesHistory({ sales: initialSales }: SalesHistoryProps) {
    const [date, setDate] = useState<Date>(new Date());
    const [fetchedSales, setFetchedSales] = useState<ExtendedSale[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterKategori, setFilterKategori] = useState<'Semua' | 'Dapur' | 'Warung'>('Semua');
    const [showTrash, setShowTrash] = useState(false);
    const [loadingAction, setLoadingAction] = useState<number | null>(null);

    // Fetch data if initialSales not provided
    useEffect(() => {
        if (!initialSales) {
            const loadData = async () => {
                setLoading(true);
                const formattedDate = format(date, 'yyyy-MM-dd');
                const result = await getSalesByDate(formattedDate);
                setFetchedSales(result.data || []);
                setLoading(false);
            };
            loadData();
        }
    }, [date, initialSales]);

    const activeSales = initialSales || fetchedSales;

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredSales = useMemo(() => {
        return activeSales.filter(sale => {
            // If we fetched by date, we don't strictly need to check date here, 
            // but if initialSales is provided (from parent), we do.
            const saleDate = new Date(sale.tanggal).toDateString();
            const selectedDate = date.toDateString();
            const matchesDate = saleDate === selectedDate;

            const matchesSearch = sale.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(sale.id).toLowerCase().includes(searchTerm.toLowerCase());
            const matchesKategori = filterKategori === 'Semua' || sale.kategori === filterKategori;
            const matchesTrash = showTrash ? sale.is_deleted : !sale.is_deleted;

            return matchesDate && matchesSearch && matchesKategori && matchesTrash;
        });
    }, [activeSales, date, searchTerm, filterKategori, showTrash]);

    const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
    const currentSales = filteredSales.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const salesDapur = filteredSales.filter(s => s.kategori === 'Dapur');
    const salesWarung = filteredSales.filter(s => s.kategori === 'Warung');

    const handleRestore = async (sale: Sale) => {
        setLoadingAction(sale.id);
        const res = await restoreHistorySale(sale);
        if (res.success) alert('Berhasil dikembalikan');
        else alert('Gagal mengembalikan: ' + res.error);
        setLoadingAction(null);
    };

    const handleDeleteFinal = async (id: number) => {
        if (!confirm('Hapus permanen? Data tidak bisa dikembalikan lagi.')) return;
        setLoadingAction(id);
        const res = await deleteHistorySale(id);
        if (res.success) alert('Berhasil dihapus permanen');
        else alert('Gagal menghapus: ' + res.error);
        setLoadingAction(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Pilih Tanggal</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[200px] justify-start text-left font-normal rounded-xl">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(date, 'PPP', { locale: id })}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Filter Kategori</label>
                        <Select value={filterKategori} onValueChange={(v: any) => setFilterKategori(v)}>
                            <SelectTrigger className="w-[150px] rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="Semua">Semua</SelectItem>
                                <SelectItem value="Dapur">Dapur</SelectItem>
                                <SelectItem value="Warung">Warung</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari pelanggan / ID..."
                            className="pl-9 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant={showTrash ? "default" : "outline"}
                        className="rounded-xl gap-2"
                        onClick={() => { setShowTrash(!showTrash); setCurrentPage(1); }}
                    >
                        <Trash2 className="h-4 w-4" />
                        {showTrash ? 'Lihat Riwayat' : 'Kotak Sampah'}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl gap-2 border-primary/20 text-primary hover:bg-primary/5">
                                <FileDown className="h-4 w-4" /> Export Laporan
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl">
                            <DropdownMenuLabel>Export Data Hari Ini</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                disabled={salesDapur.length === 0}
                                onClick={() => exportExcelForKategori(salesDapur, 'Dapur', format(date, 'yyyy-MM-dd'), 'orange')}
                                className="gap-2 cursor-pointer"
                            >
                                <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel (Dapur)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                disabled={salesWarung.length === 0}
                                onClick={() => exportExcelForKategori(salesWarung, 'Warung', format(date, 'yyyy-MM-dd'), 'blue')}
                                className="gap-2 cursor-pointer"
                            >
                                <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel (Warung)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                disabled={salesDapur.length === 0}
                                onClick={() => exportPDFForKategori(salesDapur, 'Dapur', format(date, 'yyyy-MM-dd'), 'orange')}
                                className="gap-2 cursor-pointer"
                            >
                                <FileText className="h-4 w-4 text-red-600" /> PDF (Dapur)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                disabled={salesWarung.length === 0}
                                onClick={() => exportPDFForKategori(salesWarung, 'Warung', format(date, 'yyyy-MM-dd'), 'blue')}
                                className="gap-2 cursor-pointer"
                            >
                                <FileText className="h-4 w-4 text-red-600" /> PDF (Warung)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-0">
                    <CardTitle className="text-lg">
                        {showTrash ? 'Kotak Sampah (Data Dihapus)' : `Riwayat Transaksi - ${format(date, 'dd MMMM yyyy', { locale: id })}`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-muted/50">
                                <TableHead className="w-12 text-center">No</TableHead>
                                <TableHead>Waktu</TableHead>
                                <TableHead>Pelanggan</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                            <p className="text-sm text-muted-foreground">Memuat data...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : currentSales.length > 0 ? (
                                currentSales.map((sale, index) => (
                                    <TableRow key={sale.id} className="hover:bg-muted/30 border-muted/50">
                                        <TableCell className="text-center font-medium text-muted-foreground">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {format(new Date(sale.created_at), 'HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold">{sale.nama}</div>
                                            <div className="text-[10px] text-muted-foreground font-mono">{sale.id}</div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sale.kategori === 'Dapur' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {sale.kategori}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-primary">
                                            Rp {new Intl.NumberFormat('id-ID').format(sale.total_harga)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {showTrash ? (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        disabled={loadingAction === sale.id}
                                                        onClick={() => handleRestore(sale)}
                                                    >
                                                        {loadingAction === sale.id ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        disabled={loadingAction === sale.id}
                                                        onClick={() => handleDeleteFinal(sale.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button size="sm" variant="outline" className="h-8 rounded-lg" asChild>
                                                    <a href={`/dashboard/sales/history/${sale.id}`}>Detail</a>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        Tidak ada data transaksi.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between py-4">
                            <p className="text-sm text-muted-foreground">
                                Halaman {currentPage} dari {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="rounded-lg h-8 w-8 p-0"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="rounded-lg h-8 w-8 p-0"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
