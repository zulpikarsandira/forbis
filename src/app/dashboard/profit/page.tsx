'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateProfit, generateAndLockAllocation, getProfitAllocation, resetAllocation, type ProfitAllocation } from '@/lib/actions/profit';
import { Loader2, Calculator, Save, RotateCcw, FileDown } from 'lucide-react';
import { ProfitChart } from '@/components/profit/profit-chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as XLSX from 'xlsx';

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

    const handleCalculate = async () => {
        setLoading(true);
        const result = await calculateProfit(startDate, endDate);
        if (result.totalLaba !== undefined) {
            setTotalLaba(result.totalLaba);
            // Also check if already generated for this period "custom"
        }
        setLoading(false);
    };

    const handleGenerate = async () => {
        if (!confirm('Apakah Anda yakin ingin generate & LOCK pembagian laba untuk periode ini?')) return;
        setGenerating(true);
        const result = await generateAndLockAllocation(startDate, endDate, periodeName);
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
        const result = await getProfitAllocation(periodeName);
        if (result.data) {
            setAllocationData(result.data);
            if (result.data.length > 0) setViewMode('report');
        }
        setLoading(false);
    };

    const handleReset = async () => {
        if (!confirm('PERINGATAN: Ini akan MENGHAPUS data pembagian laba yang sudah disimpan. Lanjutkan?')) return;
        setGenerating(true);
        await resetAllocation(periodeName);
        setAllocationData([]);
        setViewMode('calculator');
        setGenerating(false);
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(allocationData.map(item => ({
            Tanggal: item.tanggal,
            Periode: item.periode,
            Keterangan: item.keterangan,
            Jumlah: item.jumlah
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pembagian Laba");
        XLSX.writeFile(wb, `Laporan_Laba_${periodeName}.xlsx`);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pembagian Laba</h1>
                <p className="text-muted-foreground">Hitung dan distribusikan laba penjualan.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Control Panel */}
                <Card className="w-full md:w-1/3 h-fit">
                    <CardHeader>
                        <CardTitle>Periode & Hitung</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nama Periode (ID Unik)</Label>
                            <Input
                                value={periodeName}
                                onChange={(e) => setPeriodeName(e.target.value)}
                                placeholder="YYYY-MM"
                            />
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
                                <h3 className="text-lg font-medium opacity-90">Total Laba Periode Ini</h3>
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
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Laporan Pembagian Laba: {periodeName}</CardTitle>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={exportToExcel}>
                                            <FileDown className="mr-2 h-4 w-4" /> Export Excel
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={handleReset}>
                                            <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-6">
                                        <ProfitChart
                                            data={allocationData.map(item => ({ category: item.keterangan, amount: item.jumlah }))}
                                        />
                                    </div>

                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Kategori</TableHead>
                                                <TableHead className="text-right">Jumlah</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allocationData.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.keterangan}</TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.jumlah)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-gray-50 font-bold">
                                                <TableCell>TOTAL</TableCell>
                                                <TableCell className="text-right">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(allocationData.reduce((a, b) => a + b.jumlah, 0))}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>

                                    <div className="mt-4 text-xs text-gray-500 text-right">
                                        Generated by: {allocationData[0]?.generated_by} at {new Date(allocationData[0]?.generated_at).toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
