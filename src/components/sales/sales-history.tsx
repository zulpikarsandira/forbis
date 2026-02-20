'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSalesByDate, getHistoryDates, deleteHistorySale, restoreHistorySale, type Sale } from '@/lib/actions/sales';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileDown, History, ChevronDown, ReceiptText, Loader2, FileSpreadsheet, FileText, Trash2, RotateCcw, ChevronUp, XCircle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyExcelHeader, applyPDFHeader } from '@/lib/export-utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const toLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

// ── Export utilities ─────────────────────────────────────────────────────────

async function exportExcelForKategori(data: Sale[], kategori: string, date: string, variant: 'orange' | 'blue') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Laporan ${kategori}`);

    const startRow = applyExcelHeader(worksheet, `Laporan Penjualan - ${kategori}`, 'F');

    const headerRow = worksheet.getRow(startRow);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: variant === 'orange' ? 'FFF97316' : 'FF2563EB' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    data.forEach((sale, index) => {
        const row = worksheet.addRow({
            no: index + 1, tanggal: sale.tanggal, nama: sale.nama, jumlah: sale.jumlah,
            harga: sale.jumlah > 0 ? Math.round(sale.total_harga / sale.jumlah) : 0,
            total: sale.total_harga
        });
        row.eachCell((cell, colNumber) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (colNumber === 1 || colNumber === 4) cell.alignment = { horizontal: 'center' };
            else if (colNumber >= 5) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right' }; }
        });
    });

    const totalHarga = data.reduce((sum, s) => sum + s.total_harga, 0);
    const totalRow = worksheet.addRow({ no: '', tanggal: '', nama: 'TOTAL', jumlah: '', harga: '', total: totalHarga });
    totalRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        if (colNumber >= 5) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right' }; }
    });
    worksheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Penjualan_${kategori}_${date}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
}

function exportPDFForKategori(data: Sale[], kategori: string, date: string, variant: 'orange' | 'blue') {
    const doc = new jsPDF();
    const printDate = new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const printNumber = `INV-${Date.now().toString().slice(-6)}`;

    const startY = applyPDFHeader(doc, `Laporan Penjualan - ${kategori}`);

    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`No. Cetak: ${printNumber}`, 15, startY);
    doc.text(`Kategori: ${kategori}`, 15, startY + 5);
    doc.text(`Tanggal: ${printDate}`, 195, startY, { align: 'right' });
    doc.text(`Total Transaksi: ${data.length}`, 195, startY + 5, { align: 'right' });

    const totalHarga = data.reduce((sum, s) => sum + s.total_harga, 0);
    // @ts-ignore
    autoTable(doc, {
        theme: 'grid',
        headStyles: { fillColor: variant === 'orange' ? [249, 115, 22] : [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, lineColor: [200, 200, 200], lineWidth: 0.1 },
        foot: [['', '', 'TOTAL', '', '', `Rp ${totalHarga.toLocaleString('id-ID')}`]],
        footStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9); doc.setFont('helvetica', 'italic');
    doc.text('Dicetak secara otomatis oleh Sistem Forbis Cimanggung', 105, finalY + 10, { align: 'center' });
    doc.save(`Laporan_Penjualan_${kategori}_${date}.pdf`);
}

// ── Per-kategori table ───────────────────────────────────────────────────────

function HistoryKategoriTable({ data: initialData, kategori, date, variant }: {
    data: Sale[]; kategori: 'Dapur' | 'Warung'; date: string; variant: 'orange' | 'blue';
}) {
    const [exporting, setExporting] = useState(false);
    const [data, setData] = useState<Sale[]>(initialData);
    const [deletedItems, setDeletedItems] = useState<Sale[]>([]);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [restoringId, setRestoringId] = useState<number | null>(null);
    const [permDeletingId, setPermDeletingId] = useState<number | null>(null);
    const [confirmPermDelete, setConfirmPermDelete] = useState<Sale | null>(null);
    const [showTrash, setShowTrash] = useState(false);

    // Sync if parent re-fetches
    useEffect(() => { setData(initialData); setDeletedItems([]); }, [initialData]);

    // Soft delete — record moves to local trash, restorable
    const handleDelete = async (sale: Sale) => {
        setDeletingId(sale.id);
        const res = await deleteHistorySale(sale.id);
        if (res.error) { alert('Gagal menghapus: ' + res.error); }
        else {
            setData(prev => prev.filter(s => s.id !== sale.id));
            setDeletedItems(prev => [sale, ...prev]);
        }
        setDeletingId(null);
    };

    // Permanent delete — no restore possible
    const handlePermDelete = async () => {
        if (!confirmPermDelete) return;
        setPermDeletingId(confirmPermDelete.id);
        setConfirmPermDelete(null);
        const res = await deleteHistorySale(confirmPermDelete.id);
        if (res.error) { alert('Gagal hapus permanen: ' + res.error); }
        else { setData(prev => prev.filter(s => s.id !== confirmPermDelete.id)); }
        setPermDeletingId(null);
    };

    const handleRestore = async (sale: Sale) => {
        setRestoringId(sale.id);
        const res = await restoreHistorySale(sale);
        if (res.error) { alert('Gagal restore: ' + res.error); }
        else {
            setDeletedItems(prev => prev.filter(s => s.id !== sale.id));
            setData(prev => [sale, ...prev].sort((a, b) => b.id - a.id));
        }
        setRestoringId(null);
    };

    const handleExcel = async () => { setExporting(true); await exportExcelForKategori(data, kategori, date, variant); setExporting(false); };
    const handlePDF = () => { setExporting(true); exportPDFForKategori(data, kategori, date, variant); setExporting(false); };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className={cn(
                    'text-lg font-bold px-4 py-2 rounded-lg border-l-4 shadow-sm inline-flex items-center gap-2',
                    variant === 'orange' ? 'bg-orange-500/10 text-orange-600 border-orange-500' : 'bg-blue-500/10 text-blue-600 border-blue-500'
                )}>
                    Penjualan {kategori}
                    <span className="text-sm font-normal opacity-70">({data.length} transaksi)</span>
                    {deletedItems.length > 0 && (
                        <span className="ml-1 text-xs bg-red-500/10 text-red-600 rounded-full px-2 py-0.5 font-semibold">
                            {deletedItems.length} dihapus
                        </span>
                    )}
                </h3>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className={cn(
                            'gap-2 shadow-sm',
                            variant === 'orange' ? 'border-orange-200 text-orange-700 hover:bg-orange-50' : 'border-blue-200 text-blue-700 hover:bg-blue-50'
                        )} disabled={exporting || data.length === 0}>
                            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                            Cetak Laporan {kategori} <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Pilih Format</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleExcel}><FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />Export Excel (.xlsx)</DropdownMenuItem>
                        <DropdownMenuItem onClick={handlePDF}><FileText className="mr-2 h-4 w-4 text-red-600" />Export PDF (.pdf)</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Active table */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="min-w-[520px]">
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-10">No</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Nama Barang</TableHead>
                                <TableHead className="text-center">Qty</TableHead>
                                <TableHead className="text-right">Total Harga</TableHead>
                                <TableHead className="w-20 text-center">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length > 0 ? data.map((sale, i) => (
                                <TableRow key={sale.id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="text-center text-muted-foreground text-sm">{i + 1}</TableCell>
                                    <TableCell className="text-muted-foreground whitespace-nowrap">{sale.tanggal}</TableCell>
                                    <TableCell className="font-semibold text-foreground">{sale.nama}</TableCell>
                                    <TableCell className="text-center">
                                        <span className="bg-muted px-2 py-1 rounded text-xs font-bold text-muted-foreground">{sale.jumlah}</span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-foreground">{formatRupiah(sale.total_harga)}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {/* Soft delete — moves to trash, restorable */}
                                            <button
                                                onClick={() => handleDelete(sale)}
                                                disabled={deletingId === sale.id || permDeletingId === sale.id}
                                                className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                                                title="Hapus (bisa di-restore)"
                                            >
                                                {deletingId === sale.id
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : <Trash2 className="h-4 w-4" />}
                                            </button>
                                            {/* Permanent delete — no restore */}
                                            <button
                                                onClick={() => setConfirmPermDelete(sale)}
                                                disabled={deletingId === sale.id || permDeletingId === sale.id}
                                                className="p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                                                title="Hapus permanen (tidak bisa di-restore)"
                                            >
                                                {permDeletingId === sale.id
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : <XCircle className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground italic">
                                        <div className="flex flex-col items-center gap-2">
                                            <ReceiptText className="h-6 w-6 opacity-20" />
                                            <span>Tidak ada data {kategori} di tanggal ini.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {data.length > 0 && (
                                <TableRow className="bg-muted/50 font-bold border-t-2 border-border">
                                    <TableCell colSpan={3} className="text-right text-muted-foreground">TOTAL</TableCell>
                                    <TableCell className="text-center text-foreground">{data.reduce((s, r) => s + r.jumlah, 0)}</TableCell>
                                    <TableCell className="text-right font-mono text-foreground">{formatRupiah(data.reduce((s, r) => s + r.total_harga, 0))}</TableCell>
                                    <TableCell />
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Trash section */}
            {deletedItems.length > 0 && (
                <div className="rounded-xl border border-dashed border-red-500/30 bg-red-500/5 overflow-hidden">
                    <button
                        onClick={() => setShowTrash(p => !p)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Sampah ({deletedItems.length} item dihapus) — klik untuk {showTrash ? 'sembunyikan' : 'lihat'}
                        </span>
                        {showTrash ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {showTrash && (
                        <div className="overflow-x-auto border-t border-red-500/10">
                            <Table className="min-w-[500px]">
                                <TableBody>
                                    {deletedItems.map(sale => (
                                        <TableRow key={sale.id} className="opacity-70 bg-red-500/5">
                                            <TableCell className="w-10 text-center text-muted-foreground text-sm line-through">#{sale.id}</TableCell>
                                            <TableCell className="text-muted-foreground whitespace-nowrap line-through">{sale.tanggal}</TableCell>
                                            <TableCell className="text-muted-foreground line-through">{sale.nama}</TableCell>
                                            <TableCell className="text-center text-muted-foreground line-through">{sale.jumlah}</TableCell>
                                            <TableCell className="text-right font-mono text-muted-foreground line-through">{formatRupiah(sale.total_harga)}</TableCell>
                                            <TableCell className="text-center">
                                                <button
                                                    onClick={() => handleRestore(sale)}
                                                    disabled={restoringId === sale.id}
                                                    className="p-1.5 rounded-lg text-green-600 hover:bg-green-500/20 transition-colors disabled:opacity-50 flex items-center gap-1 text-xs font-medium"
                                                    title="Restore data ini"
                                                >
                                                    {restoringId === sale.id
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : <><RotateCcw className="h-3.5 w-3.5" /> Restore</>}
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            )}

            {/* Permanent delete confirmation dialog */}
            <AlertDialog open={!!confirmPermDelete} onOpenChange={(open) => { if (!open) setConfirmPermDelete(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>🗑️ Hapus Permanen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Data <strong>"{confirmPermDelete?.nama}"</strong> ({confirmPermDelete?.tanggal}) akan dihapus secara <strong>permanen</strong> dan <strong>tidak bisa dipulihkan</strong> kembali. Lanjutkan?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePermDelete} className="bg-red-600 hover:bg-red-700">
                            Ya, Hapus Permanen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function SalesHistory() {
    const [historyDates, setHistoryDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState<Date>(new Date());

    const today = new Date().toLocaleDateString('en-CA');

    useEffect(() => {
        getHistoryDates().then(res => setHistoryDates(res.dates));
    }, []);

    useEffect(() => {
        if (!selectedDate) return;
        setLoading(true);
        getSalesByDate(selectedDate).then(res => {
            setSales(res.data || []);
            setLoading(false);
        });
    }, [selectedDate]);

    // Convert string dates to Date objects for DayPicker modifiers
    const historyDateObjects = historyDates.map(toLocalDate);
    const todayDateObject = toLocalDate(today);

    const handleDayClick = (day: Date, modifiers: Record<string, boolean>) => {
        if (!modifiers.history && !modifiers.today) return; // only clickable if marked
        const dateStr = day.toLocaleDateString('en-CA');
        setSelectedDate(dateStr);
    };

    const salesDapur = sales.filter(s => s.kategori === 'Dapur');
    const salesWarung = sales.filter(s => s.kategori === 'Warung' || !s.kategori);

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Calendar Card */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-4 w-fit mx-auto lg:mx-0 shrink-0">
                    <p className="text-sm font-medium text-muted-foreground mb-3 px-1">Pilih tanggal untuk melihat data:</p>

                    {/* Legend */}
                    <div className="flex gap-4 mb-3 px-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Hari ini
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Ada data
                        </span>
                    </div>

                    <style>{`
                        .rdp-day_history { position: relative; }
                        .rdp-day_history::after {
                            content: '';
                            position: absolute;
                            bottom: 2px;
                            left: 50%;
                            transform: translateX(-50%);
                            width: 6px;
                            height: 6px;
                            border-radius: 50%;
                            background: #22c55e;
                        }
                        .rdp-day_today_active { position: relative; }
                        .rdp-day_today_active::after {
                            content: '';
                            position: absolute;
                            bottom: 2px;
                            left: 50%;
                            transform: translateX(-50%);
                            width: 6px;
                            height: 6px;
                            border-radius: 50%;
                            background: #3b82f6;
                        }
                        .rdp-day_history, .rdp-day_today_active {
                            cursor: pointer !important;
                            font-weight: 600;
                        }
                        .rdp-day_selected_custom {
                            background: #f3f4f6 !important;
                            border-radius: 8px;
                            font-weight: 700;
                        }
                    `}</style>

                    <DayPicker
                        month={month}
                        onMonthChange={setMonth}
                        modifiers={{
                            history: historyDateObjects,
                            today_active: [todayDateObject],
                            selected_custom: selectedDate ? [toLocalDate(selectedDate)] : [],
                        }}
                        modifiersClassNames={{
                            history: 'rdp-day_history',
                            today_active: 'rdp-day_today_active',
                            selected_custom: 'rdp-day_selected_custom',
                        }}
                        onDayClick={handleDayClick}
                        showOutsideDays={false}
                    />
                </div>

                {/* Right panel - info or table */}
                <div className="flex-1 min-w-0">
                    {!selectedDate ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center text-muted-foreground rounded-2xl border border-dashed border-border bg-muted/30 p-8">
                            <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="font-medium">Pilih tanggal di kalender</p>
                            <p className="text-sm mt-1">Klik tanggal yang memiliki tanda ● untuk melihat data.</p>
                        </div>
                    ) : loading ? (
                        <div className="flex justify-center items-center min-h-[200px]">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <p className="text-sm font-medium text-muted-foreground">
                                Data penjualan: <strong className="text-foreground">{selectedDate}</strong>
                            </p>
                            <HistoryKategoriTable data={salesDapur} kategori="Dapur" date={selectedDate} variant="orange" />
                            <HistoryKategoriTable data={salesWarung} kategori="Warung" date={selectedDate} variant="blue" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
