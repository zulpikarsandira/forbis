'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, FileSpreadsheet, FileText } from "lucide-react";

import ExcelJS from 'exceljs'; // Use ExcelJS for styling
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAllProducts } from '@/lib/actions/products';
import { applyExcelHeader, applyPDFHeader, getLogoBase64 } from '@/lib/export-utils';
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
    const [format, setFormat] = useState<'xlsx' | 'pdf'>('xlsx');
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

            // --- EXCELJS IMPLEMENTATION ---
            const fileName = `Export_Barang_${new Date().toISOString().split('T')[0]}.${format}`;
            const logoBase64 = await getLogoBase64();

            if (format === 'xlsx') {
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Data Barang');

                const columns = template === 'lengkap' ? [
                    { header: 'Kode', key: 'kode', width: 12 },
                    { header: 'Nama Barang', key: 'nama', width: 30 },
                    { header: 'Jenis', key: 'jenis', width: 15 },
                    { header: 'Suplier', key: 'suplier', width: 20 },
                    { header: 'Harga Modal', key: 'modal', width: 15 },
                    { header: 'Harga Jual', key: 'harga', width: 15 },
                    { header: 'Stok', key: 'stok', width: 10 },
                    { header: 'Tgl Update', key: 'updated', width: 15 },
                ] : [
                    { header: 'Kode', key: 'kode', width: 12 },
                    { header: 'Nama Barang', key: 'nama', width: 30 },
                    { header: 'Harga Jual', key: 'harga', width: 15 },
                    { header: 'Stok', key: 'stok', width: 10 },
                ];

                const startRow = applyExcelHeader(workbook, worksheet, 'DATA BARANG', columns, logoBase64);

                // Styling Header row (row 8)
                const headerRow = worksheet.getRow(startRow);
                headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                headerRow.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF2563EB' } // Blue
                };
                headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

                // Add Data starting below header
                exportData.forEach((item) => {
                    const row = worksheet.addRow(template === 'lengkap' ? {
                        kode: item['Kode'],
                        nama: item['Nama Barang'],
                        jenis: item['Jenis'],
                        suplier: item['Suplier'],
                        modal: item['Harga Modal'],
                        harga: item['Harga Jual'],
                        stok: item['Stok'],
                        updated: item['Tanggal Update']
                    } : {
                        kode: item['Kode'],
                        nama: item['Nama Barang'],
                        harga: item['Harga Jual'],
                        stok: item['Stok']
                    });

                    // Borders & Format
                    row.eachCell((cell, colNumber) => {
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

                        // Number format for money
                        if ((template === 'lengkap' && (colNumber === 5 || colNumber === 6)) ||
                            (template === 'sederhana' && colNumber === 3)) {
                            cell.numFmt = '#,##0';
                            cell.alignment = { horizontal: 'right' };
                        }
                    });
                });

                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                window.URL.revokeObjectURL(url);

            } else {
                // --- PDF IMPLEMENTATION ---
                const doc = new jsPDF();
                const startY = applyPDFHeader(doc, 'DATA BARANG', logoBase64);

                const headIndices = template === 'lengkap'
                    ? [['Kode', 'Nama', 'Jenis', 'Suplier', 'Modal', 'Jual', 'Stok']]
                    : [['Kode', 'Nama', 'Jual', 'Stok']];

                const bodyData = exportData.map(item => template === 'lengkap'
                    ? [item['Kode'], item['Nama Barang'], item['Jenis'], item['Suplier'],
                    new Intl.NumberFormat('id-ID').format(item['Harga Modal']),
                    new Intl.NumberFormat('id-ID').format(item['Harga Jual']),
                    item['Stok']]
                    : [item['Kode'], item['Nama Barang'],
                    new Intl.NumberFormat('id-ID').format(item['Harga Jual']),
                    item['Stok']]
                );

                autoTable(doc, {
                    head: headIndices,
                    body: bodyData,
                    startY: startY,
                    theme: 'grid',
                    headStyles: { fillColor: [37, 99, 235] },
                    styles: { fontSize: 8, lineColor: [200, 200, 200], lineWidth: 0.1 }
                });

                doc.save(fileName.replace('.xlsx', '.pdf'));
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
                                    onChange={(e) => setFormat(e.target.value as 'xlsx' | 'pdf')}
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
                                    value="pdf"
                                    checked={format === 'pdf'}
                                    onChange={(e) => setFormat(e.target.value as 'xlsx' | 'pdf')}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="flex items-center gap-1.5 text-sm">
                                    <FileText className="h-4 w-4 text-red-600" /> PDF (.pdf)
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
