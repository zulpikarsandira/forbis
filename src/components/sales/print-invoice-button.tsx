"use client"

import { useState } from "react"
import { Printer, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Sale } from "@/lib/actions/sales"

interface PrintInvoiceButtonProps {
    sale: Sale;
}

export function PrintInvoiceButton({ sale }: PrintInvoiceButtonProps) {
    const [loading, setLoading] = useState(false)

    const handlePrint = () => {
        setLoading(true)
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const formattedDate = new Date(sale.tanggal).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice - ${sale.nama}</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0; padding: 10px; font-size: 12px; }
                    .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                    .header h1 { margin: 0; font-size: 18px; }
                    .header p { margin: 2px 0; }
                    .details { margin-bottom: 10px; }
                    .details div { display: flex; justify-content: space-between; }
                    .items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                    .footer { text-align: center; margin-top: 20px; }
                    .total { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 5px; }
                    @media print {
                        @page { margin: 0; size: 80mm auto; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>FORBIS CIMANGGUNG</h1>
                    <p>Koperasi Karyawan & Umum</p>
                    <p>Jl. Raya Cimanggung No. 123</p>
                </div>
                
                <div class="details">
                    <div><span>No. Trx:</span> <span>#${sale.id}</span></div>
                    <div><span>Tanggal:</span> <span>${formattedDate}</span></div>
                    <div><span>Kategori:</span> <span>${sale.kategori}</span></div>
                </div>

                <div class="items">
                    <div style="margin-bottom: 5px; font-weight: bold;">${sale.nama}</div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>${sale.jumlah} x Rp ${sale.total_harga / sale.jumlah}</span>
                        <span>Rp ${sale.total_harga.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                <div class="total">
                    <span>TOTAL:</span>
                    <span>Rp ${sale.total_harga.toLocaleString('id-ID')}</span>
                </div>

                <div class="footer">
                    <p>Terima Kasih Atas Kunjungan Anda</p>
                    <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
                </div>

                <script>
                    window.onload = () => {
                        window.print();
                        setTimeout(() => window.close(), 500);
                    }
                </script>
            </body>
            </html>
        `

        printWindow.document.write(html)
        printWindow.document.close()
        setLoading(false)
    }

    return (
        <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            disabled={loading}
            className="h-8 px-2 text-xs gap-1 hover:bg-blue-50 hover:text-blue-600 border-blue-100"
        >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
            Invoice
        </Button>
    )
}
