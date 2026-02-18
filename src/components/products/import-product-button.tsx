'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { FileUp, Loader2, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { bulkCreateProducts } from '@/lib/actions/products';

export function ImportProductButton() {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const downloadTemplate = () => {
        const templateData = [
            {
                'Kode': 'BRG001',
                'Nama': 'Contoh Barang',
                'Jenis': 'Elektronik',
                'Suplier': 'PT ABC',
                'Modal': 50000,
                'Harga': 75000,
                'Stok': 10
            }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Template_Import_Barang.xlsx");
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    alert('File Excel kosong atau tidak terbaca.');
                    setLoading(false);
                    return;
                }

                // Get first item to check headers
                const firstItem: any = data[0];
                const headers = Object.keys(firstItem);

                // Flexible mapping function
                const findValue = (obj: any, possibleKeys: string[]) => {
                    const keys = Object.keys(obj);
                    const key = keys.find(k =>
                        possibleKeys.some(pk =>
                            k.toLowerCase().replace(/\s/g, '') === pk.toLowerCase().replace(/\s/g, '')
                        )
                    );
                    return key ? obj[key] : null;
                };

                const formattedData = data.map((item: any) => {
                    const kode = findValue(item, ['Kode', 'KodeBarang', 'Code']);
                    const nama = findValue(item, ['Nama', 'NamaBarang', 'Name']);

                    if (!kode || !nama) return null;

                    return {
                        kode: String(kode),
                        nama: String(nama),
                        jenis: String(findValue(item, ['Jenis', 'Kategori', 'Category']) || '-'),
                        suplier: String(findValue(item, ['Suplier', 'Supplier', 'Pemasok']) || '-'),
                        modal: Number(findValue(item, ['Modal', 'HargaModal', 'Cost']) || 0),
                        harga: Number(findValue(item, ['Harga', 'HargaJual', 'Price']) || 0),
                        jumlah: Number(findValue(item, ['Stok', 'Stock', 'Jumlah', 'Qty']) || 0),
                    };
                }).filter(Boolean) as any[];

                if (formattedData.length === 0) {
                    alert(`Tidak ada data valid. Pastikan ada kolom 'Kode' dan 'Nama'. \n\nKolom yang ditemukan di file Anda: ${headers.join(', ')}`);
                    setLoading(false);
                    return;
                }

                const result = await bulkCreateProducts(formattedData);

                if (result.error) {
                    alert(result.error);
                } else {
                    alert(`${formattedData.length} barang berhasil di-import!`);
                }
            } catch (error) {
                console.error('Import error:', error);
                alert('Gagal membaca file Excel. Pastikan formatnya benar.');
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        reader.readAsBinaryString(file);
    };

    return (
        <div className="flex gap-2">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx, .xls, .csv"
                onChange={handleImport}
            />
            <Button
                variant="outline"
                className="gap-2"
                onClick={downloadTemplate}
                title="Download Template Format"
            >
                <Download className="h-4 w-4" /> Template
            </Button>
            <Button
                variant="outline"
                className="gap-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                {loading ? 'Mengimport...' : 'Import Excel'}
            </Button>
        </div>
    );
}
