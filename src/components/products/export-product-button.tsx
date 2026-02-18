'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from 'xlsx';
import { getAllProducts } from '@/lib/actions/products';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function ExportProductButton() {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
    const [template, setTemplate] = useState<'lengkap' | 'sederhana'>('lengkap');

    const handleExport = async () => {
        setLoading(true);
        try {
            const products = await getAllProducts();

            let exportData: any[] = [];

            if (template === 'lengkap') {
                exportData = products.map(p => ({
                    'Kode': p.kode,
                    'Nama Barang': p.nama,
                    'Jenis': p.jenis || '-',
                    'Suplier': p.suplier || '-',
                    'Harga Modal': p.modal,
                    'Harga Jual': p.harga,
                    'Stok': p.jumlah,
                    'Tanggal Update': new Date(p.updated_at).toLocaleDateString('id-ID'),
                }));
            } else {
                exportData = products.map(p => ({
                    'Kode': p.kode,
                    'Nama Barang': p.nama,
                    'Harga Jual': p.harga,
                    'Stok': p.jumlah,
                }));
            }

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Data Barang");

            const fileName = `Export_Barang_${new Date().toISOString().split('T')[0]}.${format}`;

            if (format === 'xlsx') {
                XLSX.writeFile(wb, fileName);
            } else {
                const csv = XLSX.utils.sheet_to_csv(ws);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            setOpen(false);
        } catch (error) {
            console.error('Export error:', error);
            alert('Gagal mengekspor data.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FileDown className="h-4 w-4" /> Export Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Data Barang</DialogTitle>
                    <DialogDescription>
                        Pilih format dan template untuk mengekspor data inventory Anda.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Format File</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border hover:bg-slate-50 transition-colors flex-1">
                                <input
                                    type="radio"
                                    name="format"
                                    value="xlsx"
                                    checked={format === 'xlsx'}
                                    onChange={(e) => setFormat(e.target.value as 'xlsx' | 'csv')}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="flex items-center gap-1.5 text-sm">
                                    <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel (.xlsx)
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border hover:bg-slate-50 transition-colors flex-1">
                                <input
                                    type="radio"
                                    name="format"
                                    value="csv"
                                    checked={format === 'csv'}
                                    onChange={(e) => setFormat(e.target.value as 'xlsx' | 'csv')}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="flex items-center gap-1.5 text-sm">
                                    <FileText className="h-4 w-4 text-blue-600" /> CSV (.csv)
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Template Format</Label>
                        <div className="grid gap-3">
                            <label className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${template === 'lengkap' ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}`}>
                                <input
                                    type="radio"
                                    name="template"
                                    value="lengkap"
                                    checked={template === 'lengkap'}
                                    onChange={(e) => setTemplate(e.target.value as 'lengkap' | 'sederhana')}
                                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="grid gap-1">
                                    <span className="font-semibold text-sm">Template Lengkap</span>
                                    <span className="text-xs text-muted-foreground">Termasuk Kode, Nama, Jenis, Suplier, Modal, Harga, dan Stok.</span>
                                </div>
                            </label>
                            <label className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${template === 'sederhana' ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}`}>
                                <input
                                    type="radio"
                                    name="template"
                                    value="sederhana"
                                    checked={template === 'sederhana'}
                                    onChange={(e) => setTemplate(e.target.value as 'lengkap' | 'sederhana')}
                                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="grid gap-1">
                                    <span className="font-semibold text-sm">Template Sederhana</span>
                                    <span className="text-xs text-muted-foreground">Hanya Nama Barang, Kode, Harga Jual, dan Stok.</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Batal
                    </Button>
                    <Button onClick={handleExport} disabled={loading} className="bg-gradient-primary text-white border-0">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Mulai Export
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
