'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateProfit, generateAndLockAllocation, getProfitAllocation, resetAllocation, getDetailedProfitData, type ProfitAllocation } from '@/lib/actions/profit';
import { Loader2, Calculator, Save, RotateCcw, FileDown } from 'lucide-react';
import { ProfitChart } from '@/components/profit/profit-chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as XLSX from 'xlsx'; // Leaving for fallback if needed, but primary is ExcelJS
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfitPage() {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0].slice(0, 7) + '-01'); // First day of current month
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [totalLaba, setTotalLaba] = useState<number | null>(null);
    const [allocationData, setAllocationData] = useState<ProfitAllocation[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    // View state
    const [viewMode, setViewMode] = useState<'calculator' | 'report'>('calculator');
    const [periodeName, setPeriodeName] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [activeTab, setActiveTab] = useState<'Warung' | 'Dapur'>('Warung');

    // Reset state when tab changes
    useEffect(() => {
        setTotalLaba(null);
        setAllocationData([]);
        setViewMode('calculator');
        // Optionally fetch existing data if user just switches tabs?
        // Let's autoswitch to report mode if data exists ?
        // For now, let's keep it manual or simple.
        checkExistingData();
    }, [activeTab, periodeName]);

    const getFullPeriodeName = () => {
        return `${periodeName}-${activeTab.toUpperCase()}`;
    };

    const checkExistingData = async () => {
        setLoading(true);
        const result = await getProfitAllocation(getFullPeriodeName());
        if (result.data && result.data.length > 0) {
            setAllocationData(result.data);
            setViewMode('report');
        } else {
            setAllocationData([]);
            setViewMode('calculator');
        }
        setLoading(false);
    }

    const handleCalculate = async () => {
        setLoading(true);
        const result = await calculateProfit(startDate, endDate, activeTab);
        if (result.totalLaba !== undefined) {
            setTotalLaba(result.totalLaba);
        }
        setLoading(false);
    };

    const handleGenerate = async () => {
        const fullPeriodeName = getFullPeriodeName();
        if (!confirm(`Apakah Anda yakin ingin generate & LOCK pembagian laba untuk ${activeTab} periode ${periodeName}?`)) return;
        setGenerating(true);
        const result = await generateAndLockAllocation(startDate, endDate, fullPeriodeName, activeTab);
        if (result.success) {
            await fetchAllocation();
            setViewMode('report');
        } else {
            alert(result.error);
        }
        setGenerating(false);
    };

    const fetchAllocation = async () => {
        setLoading(true);
        const result = await getProfitAllocation(getFullPeriodeName());
        if (result.data) {
            setAllocationData(result.data);
            if (result.data.length > 0) setViewMode('report');
        }
        setLoading(false);
    };

    const handleReset = async () => {
        if (!confirm('PERINGATAN: Ini akan MENGHAPUS data pembagian laba yang sudah disimpan. Lanjutkan?')) return;
        setGenerating(true);
        await resetAllocation(getFullPeriodeName());
        setAllocationData([]);
        setViewMode('calculator');
        setTotalLaba(null); // Reset calculated profit too
        setGenerating(false);
    };

    const exportToExcel = async () => {
        setLoading(true);
        try {
            const { data, error } = await getDetailedProfitData(startDate, endDate, activeTab);

            if (error || !data) {
                alert('Gagal mengambil data detail: ' + error);
                setLoading(false);
                return;
            }

            // Create Workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(`Laba ${activeTab}`, {
                views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }]
            });

            // --- 1. Define Columns & Headers ---
            // Row 1: Merged Headers
            // A1: NO, B1: Tgl, C1: NO. FAKTUR, D1: NAMA BARANG, E1: BANYAK, F1: SATUAN, G1: HARGA SUPLIER, H1: JUMLAH, I1: HARGA KOPERASI, J1: JUMLAH, K1: PROFIT, L1: ZAKAT, M1: SISA
            // N1-O1: SPJG, P1-T1: Rincian OPERASIONAL, U1: DLL (Wait, let's map exactly to image)
            // Image Cols: 
            // 1. NO
            // 2. Tgl
            // 3. NO. FAKTUR
            // 4. NAMA BARANG
            // 5. BANYAK
            // 6. SATUAN
            // 7. HARGA SUPLIER
            // 8. JUMLAH (Modal)
            // 9. HARGA KOPERASI
            // 10. JUMLAH (Jual)
            // 11. PROFIT
            // 12. ZAKAT
            // 13. SISA
            // 14-15. SPJG (Row 2: CASHBACK DAPUR, KOP. FORBIS)
            // 16. OPERASIONAL (Row 2: 80%) -> Wait, image shows "OPERASIONAL" above "80%" (Col 16)
            // 17. SHU (Row 2: 20%) -> Wait, image shows "SHU" above "20%" (Col 17) -- Actually checking image again

            // Correction based on image analysis:
            // Col 14-15 merged title "SPJG". Subtitles: "CASHBACK DAPUR", "KOP. FORBIS".
            // Col 16 title "OPERASIONAL". Subtitle "80%"? No, actually typically it is:
            // Let's look closer at the image.
            // "SPJG" spans 2 cols. Under it: "CASHBACK DAPUR", "KOP. FORBIS".
            // Then next cols: OPERASIONAL | SHU | ... ??
            // OR is "OPERASIONAL" the parent of the workers?
            // YES. "Rincian OPERASIONAL" or just "OPERASIONAL" spans generally the worker columns.
            // Let's assume the previous column mapping was acceptable to user:
            // Cols: ... SISA | Cashback | Kop | Ops | SHU | Workers ...

            // Let's refine the headers to be structurally correct.
            // A-M: Standard.
            // N-O: Group "SPJG" -> Cashback, Kop.
            // P-Q: Group "ALOKASI KOP" (Implicit) -> Ops, SHU.
            // R-V: Group "PEMBAGIAN OPERASIONAL" -> P1, P2, P3, P4, DLL.

            // Setting up Header Row 1
            worksheet.getCell('A1').value = "NO";
            worksheet.getCell('B1').value = "Tgl";
            worksheet.getCell('C1').value = "NO. FAKTUR";
            worksheet.getCell('D1').value = "NAMA BARANG";
            worksheet.getCell('E1').value = "BANYAK";
            worksheet.getCell('F1').value = "SATUAN";
            worksheet.getCell('G1').value = "HARGA SUPLIER";
            worksheet.getCell('H1').value = "JUMLAH";
            worksheet.getCell('I1').value = "HARGA KOPERASI";
            worksheet.getCell('J1').value = "JUMLAH";
            worksheet.getCell('K1').value = "PROFIT";
            worksheet.getCell('L1').value = "ZAKAT";
            worksheet.getCell('M1').value = "SISA";

            worksheet.getCell('N1').value = "SPJG";
            worksheet.mergeCells('N1:O1');

            // Let's say P is Ops 80% and Q is SHU 20%
            worksheet.getCell('P1').value = "ALOKASI KOP"; // Or just blank/merged
            worksheet.mergeCells('P1:Q1');

            worksheet.getCell('R1').value = "RINCIAN OPERASIONAL";
            worksheet.mergeCells('R1:V1');

            // Setting up Header Row 2
            worksheet.getCell('N2').value = "CASHBACK DAPUR";
            worksheet.getCell('O2').value = "KOP. FORBIS";

            worksheet.getCell('P2').value = "OPERASIONAL (80%)";
            worksheet.getCell('Q2').value = "SHU (20%)";

            worksheet.getCell('R2').value = "PEKERJA 1";
            worksheet.getCell('S2').value = "PEKERJA 2";
            worksheet.getCell('T2').value = "PEKERJA 3";
            worksheet.getCell('U2').value = "PEKERJA 4";
            worksheet.getCell('V2').value = "DLL";

            // Merge A1:A2, B1:B2, etc for first 13 cols
            ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].forEach(col => {
                worksheet.mergeCells(`${col}1:${col}2`);
            });

            // Styling (Blue Header, Bold, Borders)
            const headerFill: Partial<ExcelJS.Fill> = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF00B0F0' } // Cyan/Blue like image
            };
            const fontBold: Partial<ExcelJS.Font> = { bold: true, name: 'Arial', size: 10 };
            const borderStyle: Partial<ExcelJS.Borders> = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            // Apply style to all header cells
            for (let r = 1; r <= 2; r++) {
                for (let c = 1; c <= 22; c++) {
                    const cell = worksheet.getCell(r, c);
                    cell.fill = headerFill;
                    cell.font = fontBold;
                    cell.border = borderStyle;
                    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                }
            }

            // --- 2. Add Data ---
            let currentRow = 3;
            data.forEach((item, index) => {
                const row = worksheet.getRow(currentRow);

                row.getCell(1).value = index + 1;
                row.getCell(2).value = item.tanggal;
                row.getCell(3).value = item.no_faktur;
                row.getCell(4).value = item.nama_barang;
                row.getCell(5).value = item.banyak;
                row.getCell(6).value = item.satuan || 'Pcs';
                row.getCell(7).value = item.harga_suplier;
                row.getCell(8).value = item.jumlah_modal;
                row.getCell(9).value = item.harga_koperasi;
                row.getCell(10).value = item.jumlah_jual;
                row.getCell(11).value = item.laba;
                row.getCell(12).value = item.zakat;
                row.getCell(13).value = item.sisa;
                row.getCell(14).value = item.cashback_dapur;
                row.getCell(15).value = item.kop_forbis;
                row.getCell(16).value = item.operasional;
                row.getCell(17).value = item.shu;
                row.getCell(18).value = item.pekerja_a;
                row.getCell(19).value = item.pekerja_b;
                row.getCell(20).value = item.pekerja_c;
                row.getCell(21).value = item.pekerja_d;
                row.getCell(22).value = item.dll;

                // Apply borders and format
                for (let c = 1; c <= 22; c++) {
                    const cell = row.getCell(c);
                    cell.border = borderStyle;
                    cell.alignment = { vertical: 'middle', horizontal: c <= 4 ? 'left' : 'right' };

                    // Number format for money cols (7-22)
                    if (c >= 7) {
                        cell.numFmt = '#,##0';
                    }
                }

                currentRow++;
            });

            // --- 3. Add Totals ---
            const totals = data.reduce((acc, curr) => ({
                jumlah_modal: acc.jumlah_modal + curr.jumlah_modal,
                jumlah_jual: acc.jumlah_jual + curr.jumlah_jual,
                laba: acc.laba + curr.laba,
                zakat: acc.zakat + curr.zakat,
                sisa: acc.sisa + curr.sisa,
                cashback: acc.cashback + curr.cashback_dapur,
                kop: acc.kop + curr.kop_forbis,
                ops: acc.ops + curr.operasional,
                shu: acc.shu + curr.shu,
                p1: acc.p1 + curr.pekerja_a,
                p2: acc.p2 + curr.pekerja_b,
                p3: acc.p3 + curr.pekerja_c,
                p4: acc.p4 + curr.pekerja_d,
                dll: acc.dll + curr.dll
            }), { jumlah_modal: 0, jumlah_jual: 0, laba: 0, zakat: 0, sisa: 0, cashback: 0, kop: 0, ops: 0, shu: 0, p1: 0, p2: 0, p3: 0, p4: 0, dll: 0 });

            const totalRow = worksheet.getRow(currentRow);
            totalRow.getCell(3).value = "TOTAL"; // At No Faktur col
            totalRow.getCell(8).value = totals.jumlah_modal;
            totalRow.getCell(10).value = totals.jumlah_jual;
            totalRow.getCell(11).value = totals.laba;
            totalRow.getCell(12).value = totals.zakat;
            totalRow.getCell(13).value = totals.sisa;
            totalRow.getCell(14).value = totals.cashback;
            totalRow.getCell(15).value = totals.kop;
            totalRow.getCell(16).value = totals.ops;
            totalRow.getCell(17).value = totals.shu;
            totalRow.getCell(18).value = totals.p1;
            totalRow.getCell(19).value = totals.p2;
            totalRow.getCell(20).value = totals.p3;
            totalRow.getCell(21).value = totals.p4;
            totalRow.getCell(22).value = totals.dll;

            // Style Totals
            for (let c = 1; c <= 22; c++) {
                const cell = totalRow.getCell(c);
                cell.border = borderStyle;
                cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }; // Light gray
                if (c >= 7 && cell.value) cell.numFmt = '#,##0';
            }
            worksheet.mergeCells(`A${currentRow}:G${currentRow}`); // Merge empty left cells
            totalRow.getCell(1).alignment = { horizontal: 'center' };

            // --- 4. Column Widths ---
            worksheet.columns = [
                { width: 5 }, { width: 12 }, { width: 18 }, { width: 25 }, { width: 8 }, { width: 8 }, // A-F
                { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 12 }, // G-L
                { width: 14 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 }, // M-Q
                { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 } // R-V
            ];

            // Generate Buffer
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Download
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `Laporan_Laba_${getFullPeriodeName()}.xlsx`;
            anchor.click();
            window.URL.revokeObjectURL(url);

        } catch (e) {
            console.error(e);
            alert('Gagal export excel: ' + e);
        }
        setLoading(false);
    };

    const exportToPDF = async () => {
        setLoading(true);
        try {
            const { data, error } = await getDetailedProfitData(startDate, endDate, activeTab);

            if (error || !data) {
                alert('Gagal mengambil data detail: ' + error);
                setLoading(false);
                return;
            }

            const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

            doc.setFontSize(16);
            doc.text(`Laporan Pembagian Laba (${activeTab}): ${periodeName}`, 14, 15);
            doc.setFontSize(10);
            doc.text(`Generated by: ${data[0]?.nama_barang ? 'System' : 'System'}`, 14, 22);

            const tableColumn = [
                "No", "Tgl", "Barang", "Banyak", "Modal", "Jual", "Laba",
                "Zakat", "Sisa", "Cashback", "Kop", "Ops", "SHU",
                "Pekerja A", "Pekerja B", "Pekerja C", "Pekerja D", "DLL"
            ];

            const tableRows: any[] = [];

            data.forEach((item, index) => {
                const rowData = [
                    index + 1,
                    item.tanggal,
                    item.nama_barang,
                    item.banyak,
                    new Intl.NumberFormat('id-ID').format(item.harga_suplier),
                    new Intl.NumberFormat('id-ID').format(item.harga_koperasi),
                    new Intl.NumberFormat('id-ID').format(item.laba),
                    new Intl.NumberFormat('id-ID').format(item.zakat),
                    new Intl.NumberFormat('id-ID').format(item.sisa),
                    new Intl.NumberFormat('id-ID').format(item.cashback_dapur),
                    new Intl.NumberFormat('id-ID').format(item.kop_forbis),
                    new Intl.NumberFormat('id-ID').format(item.operasional),
                    new Intl.NumberFormat('id-ID').format(item.shu),
                    new Intl.NumberFormat('id-ID').format(item.pekerja_a),
                    new Intl.NumberFormat('id-ID').format(item.pekerja_b),
                    new Intl.NumberFormat('id-ID').format(item.pekerja_c),
                    new Intl.NumberFormat('id-ID').format(item.pekerja_d),
                    new Intl.NumberFormat('id-ID').format(item.dll),
                ];
                tableRows.push(rowData);
            });

            // Calculate Totals
            const totals = data.reduce((acc, curr) => ({
                laba: acc.laba + curr.laba,
                zakat: acc.zakat + curr.zakat,
                sisa: acc.sisa + curr.sisa,
                cashback: acc.cashback + curr.cashback_dapur,
                kop: acc.kop + curr.kop_forbis,
                ops: acc.ops + curr.operasional,
                shu: acc.shu + curr.shu,
                p1: acc.p1 + curr.pekerja_a,
                p2: acc.p2 + curr.pekerja_b,
                p3: acc.p3 + curr.pekerja_c,
                p4: acc.p4 + curr.pekerja_d,
                dll: acc.dll + curr.dll
            }), { laba: 0, zakat: 0, sisa: 0, cashback: 0, kop: 0, ops: 0, shu: 0, p1: 0, p2: 0, p3: 0, p4: 0, dll: 0 });

            // Add Total Row
            tableRows.push([
                "", "", "TOTAL", "", "", "",
                new Intl.NumberFormat('id-ID').format(totals.laba),
                new Intl.NumberFormat('id-ID').format(totals.zakat),
                new Intl.NumberFormat('id-ID').format(totals.sisa),
                new Intl.NumberFormat('id-ID').format(totals.cashback),
                new Intl.NumberFormat('id-ID').format(totals.kop),
                new Intl.NumberFormat('id-ID').format(totals.ops),
                new Intl.NumberFormat('id-ID').format(totals.shu),
                new Intl.NumberFormat('id-ID').format(totals.p1),
                new Intl.NumberFormat('id-ID').format(totals.p2),
                new Intl.NumberFormat('id-ID').format(totals.p3),
                new Intl.NumberFormat('id-ID').format(totals.p4),
                new Intl.NumberFormat('id-ID').format(totals.dll),
            ]);


            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 30,
                styles: { fontSize: 6, cellPadding: 1 },
                headStyles: { fillColor: [22, 163, 74] }, // Green
            });

            doc.save(`Laporan_Laba_${getFullPeriodeName()}.pdf`);

        } catch (e) {
            console.error(e);
            alert('Gagal export PDF.');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pembagian Laba</h1>
                <p className="text-muted-foreground">Hitung dan distribusikan laba penjualan.</p>
            </div>

            <Tabs defaultValue="Warung" value={activeTab} onValueChange={(val) => setActiveTab(val as 'Warung' | 'Dapur')} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="Warung">Laba Warung</TabsTrigger>
                    <TabsTrigger value="Dapur">Laba Dapur</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Control Panel */}
                        <Card className="w-full md:w-1/3 h-fit">
                            <CardHeader>
                                <CardTitle>Periode & Hitung ({activeTab})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nama Periode (ID Unik)</Label>
                                    <Input
                                        value={periodeName}
                                        onChange={(e) => setPeriodeName(e.target.value)}
                                        placeholder="YYYY-MM"
                                    />
                                    <p className="text-xs text-muted-foreground">Sistem akan menyimpan sebagai: <b>{getFullPeriodeName()}</b></p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal Awal</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal Akhir</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button onClick={handleCalculate} disabled={loading} className="w-full" variant="outline">
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                                        Hitung Laba
                                    </Button>
                                    <Button onClick={fetchAllocation} disabled={loading} className="w-full" variant="secondary">
                                        Cek Data
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Main Content Area */}
                        <div className="w-full md:w-2/3 space-y-6">

                            {totalLaba !== null && viewMode === 'calculator' && (
                                <Card className="bg-gradient-primary text-white border-0 shadow-xl">
                                    <CardContent className="p-8 text-center">
                                        <h3 className="text-lg font-medium opacity-90">Total Laba {activeTab} Periode Ini</h3>
                                        <div className="text-4xl font-bold mt-2">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalLaba)}
                                        </div>
                                        <div className="mt-6 flex justify-center">
                                            <Button
                                                onClick={handleGenerate}
                                                disabled={generating}
                                                className="bg-white text-blue-600 hover:bg-gray-100 font-bold border-0"
                                            >
                                                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                Generate & Lock Pembagian
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {viewMode === 'report' && allocationData.length > 0 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                    <Card>
                                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <CardTitle>Laporan Pembagian Laba {activeTab}: {periodeName}</CardTitle>
                                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="sm" variant="outline" className="flex-1 sm:flex-none gap-2">
                                                            <FileDown className="h-4 w-4" /> Export Data <ChevronDown className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Pilih Format</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={exportToExcel}>
                                                            <FileDown className="mr-2 h-4 w-4" /> Export Excel (.xlsx)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={exportToPDF}>
                                                            <FileText className="mr-2 h-4 w-4" /> Export PDF (.pdf)
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                <Button size="sm" variant="destructive" onClick={handleReset} className="flex-1 sm:flex-none">
                                                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="mb-6 overflow-hidden">
                                                <ProfitChart
                                                    data={allocationData.map(item => ({ category: item.keterangan, amount: item.jumlah }))}
                                                />
                                            </div>

                                            <div className="rounded-xl border border-gray-100 overflow-hidden">
                                                <div className="overflow-x-auto">
                                                    <Table className="min-w-[500px]">
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Kategori</TableHead>
                                                                <TableHead className="text-right">Jumlah</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {allocationData.map((item) => (
                                                                <TableRow key={item.id}>
                                                                    <TableCell className="font-medium whitespace-nowrap">{item.keterangan}</TableCell>
                                                                    <TableCell className="text-right font-mono whitespace-nowrap">
                                                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.jumlah)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                            <TableRow className="bg-gray-50 font-bold">
                                                                <TableCell>TOTAL</TableCell>
                                                                <TableCell className="text-right whitespace-nowrap">
                                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(allocationData.reduce((a, b) => a + b.jumlah, 0))}
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>

                                            <div className="mt-4 text-[10px] sm:text-xs text-gray-500 text-right italic">
                                                Generated by: {allocationData[0]?.generated_by} at {new Date(allocationData[0]?.generated_at).toLocaleString()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
