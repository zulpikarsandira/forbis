'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { getAllProducts } from '@/lib/actions/products';

export function PrintProductButton() {
    const [loading, setLoading] = useState(false);

    const handlePrint = async () => {
        setLoading(true);
        try {
            const products = await getAllProducts();

            // Create a print-only window or iframe
            const printWindow = window.open('', '_blank');
            if (!printWindow) return;

            const html = `
                <html>
                    <head>
                        <title>Data Inventory Barang - Forbis</title>
                        <style>
                            body { font-family: sans-serif; padding: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                            th { background-color: #f2 f2 f2; }
                            h1 { text-align: center; font-size: 18px; }
                            .footer { margin-top: 20px; text-align: right; font-size: 10px; }
                            @media print {
                                @page { margin: 1cm; }
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Laporan Data Inventory Barang</h1>
                        <p>Tanggal Cetak: ${new Date().toLocaleString('id-ID')}</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Kode</th>
                                    <th>Nama Barang</th>
                                    <th>Jenis</th>
                                    <th>Suplier</th>
                                    <th>Harga Jual</th>
                                    <th>Stok</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${products.map((p, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>${p.kode}</td>
                                        <td>${p.nama}</td>
                                        <td>${p.jenis || '-'}</td>
                                        <td>${p.suplier || '-'}</td>
                                        <td>Rp ${p.harga.toLocaleString('id-ID')}</td>
                                        <td>${p.jumlah}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div class="footer">
                            Dicetak otomatis oleh Sistem Forbis pada ${new Date().toLocaleString()}
                        </div>
                        <script>
                            window.onload = function() {
                                window.print();
                                window.onafterprint = function() {
                                    window.close();
                                };
                            };
                        </script>
                    </body>
                </html>
            `;

            printWindow.document.write(html);
            printWindow.document.close();
        } catch (error) {
            console.error('Print error:', error);
            alert('Gagal mengambil data untuk cetak.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={handlePrint}
            disabled={loading}
            title="Cetak Data Barang"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
        </Button>
    );
}
