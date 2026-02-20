'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfitAllocation, getDetailedProfitData, type ProfitAllocation } from '@/lib/actions/profit';
import { Loader2, FileDown } from 'lucide-react';
import { ProfitChart } from '@/components/profit/profit-chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UserProfitPage() {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0].slice(0, 7) + '-01');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [allocationData, setAllocationData] = useState<ProfitAllocation[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'Warung' | 'Dapur'>('Warung');
    const [periodeName, setPeriodeName] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        setAllocationData([]);
        checkExistingData();
    }, [activeTab, periodeName]);

    const getFullPeriodeName = () => `${periodeName}-${activeTab.toUpperCase()}`;

    const checkExistingData = async () => {
        setLoading(true);
        const result = await getProfitAllocation(getFullPeriodeName());
        if (result.data && result.data.length > 0) {
            setAllocationData(result.data);
        } else {
            setAllocationData([]);
        }
        setLoading(false);
    };

    const exportToExcel = async () => {
        setLoading(true);
        try {
            const { data, error } = await getDetailedProfitData(startDate, endDate, activeTab);
            if (error || !data) { alert('Gagal mengambil data: ' + error); setLoading(false); return; }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(`Laba ${activeTab}`, { views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }] });

            worksheet.getCell('A1').value = "NO"; worksheet.getCell('B1').value = "Tgl";
            worksheet.getCell('C1').value = "NO. FAKTUR"; worksheet.getCell('D1').value = "NAMA BARANG";
            worksheet.getCell('E1').value = "BANYAK"; worksheet.getCell('F1').value = "SATUAN";
            worksheet.getCell('G1').value = "HARGA SUPLIER"; worksheet.getCell('H1').value = "JUMLAH";
            worksheet.getCell('I1').value = "HARGA KOPERASI"; worksheet.getCell('J1').value = "JUMLAH";
            worksheet.getCell('K1').value = "PROFIT"; worksheet.getCell('L1').value = "ZAKAT";
            worksheet.getCell('M1').value = "SISA";
            worksheet.getCell('N1').value = "SPJG"; worksheet.mergeCells('N1:O1');
            worksheet.getCell('P1').value = "ALOKASI KOP"; worksheet.mergeCells('P1:Q1');
            worksheet.getCell('R1').value = "RINCIAN OPERASIONAL"; worksheet.mergeCells('R1:V1');
            worksheet.getCell('N2').value = "CASHBACK DAPUR"; worksheet.getCell('O2').value = "KOP. FORBIS";
            worksheet.getCell('P2').value = "OPERASIONAL (80%)"; worksheet.getCell('Q2').value = "SHU (20%)";
            worksheet.getCell('R2').value = "PEKERJA 1"; worksheet.getCell('S2').value = "PEKERJA 2";
            worksheet.getCell('T2').value = "PEKERJA 3"; worksheet.getCell('U2').value = "PEKERJA 4";
            worksheet.getCell('V2').value = "DLL";
            ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].forEach(col => worksheet.mergeCells(`${col}1:${col}2`));

            const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B0F0' } } as unknown as ExcelJS.Fill;
            const fontBold = { bold: true, name: 'Arial', size: 10 } as unknown as ExcelJS.Font;
            const borderStyle = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } as unknown as ExcelJS.Borders;

            for (let r = 1; r <= 2; r++) {
                for (let c = 1; c <= 22; c++) {
                    const cell = worksheet.getCell(r, c);
                    cell.fill = headerFill; cell.font = fontBold; cell.border = borderStyle;
                    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                }
            }

            let currentRow = 3;
            data.forEach((item, index) => {
                const row = worksheet.getRow(currentRow);
                row.getCell(1).value = index + 1; row.getCell(2).value = item.tanggal;
                row.getCell(3).value = item.no_faktur; row.getCell(4).value = item.nama_barang;
                row.getCell(5).value = item.banyak; row.getCell(6).value = item.satuan || 'Pcs';
                row.getCell(7).value = item.harga_suplier; row.getCell(8).value = item.jumlah_modal;
                row.getCell(9).value = item.harga_koperasi; row.getCell(10).value = item.jumlah_jual;
                row.getCell(11).value = item.laba; row.getCell(12).value = item.zakat;
                row.getCell(13).value = item.sisa; row.getCell(14).value = item.cashback_dapur;
                row.getCell(15).value = item.kop_forbis; row.getCell(16).value = item.operasional;
                row.getCell(17).value = item.shu; row.getCell(18).value = item.pekerja_a;
                row.getCell(19).value = item.pekerja_b; row.getCell(20).value = item.pekerja_c;
                row.getCell(21).value = item.pekerja_d; row.getCell(22).value = item.dll;
                for (let c = 1; c <= 22; c++) {
                    const cell = row.getCell(c); cell.border = borderStyle;
                    cell.alignment = { vertical: 'middle', horizontal: c <= 4 ? 'left' : 'right' };
                    if (c >= 7) cell.numFmt = '#,##0';
                }
                currentRow++;
            });

            const totals = data.reduce((acc, curr) => ({
                jumlah_modal: acc.jumlah_modal + curr.jumlah_modal, jumlah_jual: acc.jumlah_jual + curr.jumlah_jual,
                laba: acc.laba + curr.laba, zakat: acc.zakat + curr.zakat, sisa: acc.sisa + curr.sisa,
                cashback: acc.cashback + curr.cashback_dapur, kop: acc.kop + curr.kop_forbis,
                ops: acc.ops + curr.operasional, shu: acc.shu + curr.shu,
                p1: acc.p1 + curr.pekerja_a, p2: acc.p2 + curr.pekerja_b,
                p3: acc.p3 + curr.pekerja_c, p4: acc.p4 + curr.pekerja_d, dll: acc.dll + curr.dll
            }), { jumlah_modal: 0, jumlah_jual: 0, laba: 0, zakat: 0, sisa: 0, cashback: 0, kop: 0, ops: 0, shu: 0, p1: 0, p2: 0, p3: 0, p4: 0, dll: 0 });

            const totalRow = worksheet.getRow(currentRow);
            totalRow.getCell(3).value = "TOTAL"; totalRow.getCell(8).value = totals.jumlah_modal;
            totalRow.getCell(10).value = totals.jumlah_jual; totalRow.getCell(11).value = totals.laba;
            totalRow.getCell(12).value = totals.zakat; totalRow.getCell(13).value = totals.sisa;
            totalRow.getCell(14).value = totals.cashback; totalRow.getCell(15).value = totals.kop;
            totalRow.getCell(16).value = totals.ops; totalRow.getCell(17).value = totals.shu;
            totalRow.getCell(18).value = totals.p1; totalRow.getCell(19).value = totals.p2;
            totalRow.getCell(20).value = totals.p3; totalRow.getCell(21).value = totals.p4;
            totalRow.getCell(22).value = totals.dll;
            for (let c = 1; c <= 22; c++) {
                const cell = totalRow.getCell(c); cell.border = borderStyle; cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } } as unknown as ExcelJS.Fill;
                if (c >= 7 && cell.value) cell.numFmt = '#,##0';
            }
            worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
            worksheet.columns = [
                { width: 5 }, { width: 12 }, { width: 18 }, { width: 25 }, { width: 8 }, { width: 8 },
                { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 12 },
                { width: 14 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 },
                { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }
            ];

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url; anchor.download = `Laporan_Laba_${getFullPeriodeName()}.xlsx`; anchor.click();
            window.URL.revokeObjectURL(url);
        } catch (e) { console.error(e); alert('Gagal export excel: ' + e); }
        setLoading(false);
    };

    const exportToPDF = async () => {
        setLoading(true);
        try {
            const { data, error } = await getDetailedProfitData(startDate, endDate, activeTab);
            if (error || !data) { alert('Gagal mengambil data: ' + error); setLoading(false); return; }

            const doc = new jsPDF('l', 'mm', 'a4');
            doc.setFontSize(16);
            doc.text(`Laporan Pembagian Laba (${activeTab}): ${periodeName}`, 14, 15);
            doc.setFontSize(10);
            doc.text('Generated by: System', 14, 22);

            const tableColumn = ["No", "Tgl", "Barang", "Banyak", "Modal", "Jual", "Laba", "Zakat", "Sisa", "Cashback", "Kop", "Ops", "SHU", "Pekerja A", "Pekerja B", "Pekerja C", "Pekerja D", "DLL"];
            const tableRows: any[] = data.map((item, i) => [
                i + 1, item.tanggal, item.nama_barang, item.banyak,
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
            ]);

            const totals = data.reduce((acc, curr) => ({
                laba: acc.laba + curr.laba, zakat: acc.zakat + curr.zakat, sisa: acc.sisa + curr.sisa,
                cashback: acc.cashback + curr.cashback_dapur, kop: acc.kop + curr.kop_forbis,
                ops: acc.ops + curr.operasional, shu: acc.shu + curr.shu,
                p1: acc.p1 + curr.pekerja_a, p2: acc.p2 + curr.pekerja_b,
                p3: acc.p3 + curr.pekerja_c, p4: acc.p4 + curr.pekerja_d, dll: acc.dll + curr.dll
            }), { laba: 0, zakat: 0, sisa: 0, cashback: 0, kop: 0, ops: 0, shu: 0, p1: 0, p2: 0, p3: 0, p4: 0, dll: 0 });

            tableRows.push(["", "", "TOTAL", "", "", "",
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

            autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30, styles: { fontSize: 6, cellPadding: 1 }, headStyles: { fillColor: [22, 163, 74] } });
            doc.save(`Laporan_Laba_${getFullPeriodeName()}.pdf`);
        } catch (e) { console.error(e); alert('Gagal export PDF.'); }
        setLoading(false);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pembagian Laba</h1>
                <p className="text-muted-foreground">Lihat dan export laporan pembagian laba.</p>
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
                                <CardTitle>Periode ({activeTab})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nama Periode</Label>
                                    <Input
                                        value={periodeName}
                                        onChange={(e) => setPeriodeName(e.target.value)}
                                        placeholder="YYYY-MM"
                                    />
                                    <p className="text-xs text-muted-foreground">Periode: <b>{getFullPeriodeName()}</b></p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal Awal (untuk export)</Label>
                                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal Akhir (untuk export)</Label>
                                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                                <div className="pt-2">
                                    <Button onClick={checkExistingData} disabled={loading} className="w-full" variant="secondary">
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Muat Data
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Main Content Area */}
                        <div className="w-full md:w-2/3 space-y-6">
                            {loading && (
                                <div className="flex justify-center items-center py-20">
                                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                                </div>
                            )}

                            {!loading && allocationData.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 bg-white rounded-[2rem] border border-gray-100">
                                    <p className="text-lg font-medium">Belum ada data pembagian laba</p>
                                    <p className="text-sm mt-1">untuk periode <b>{getFullPeriodeName()}</b></p>
                                    <p className="text-xs mt-4 text-gray-300">Data akan muncul setelah Admin melakukan generate & lock.</p>
                                </div>
                            )}

                            {!loading && allocationData.length > 0 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                    <Card>
                                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <CardTitle>Laporan Pembagian Laba {activeTab}: {periodeName}</CardTitle>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" variant="outline" className="gap-2">
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
