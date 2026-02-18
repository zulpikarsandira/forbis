"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Sale } from "@/lib/actions/sales"
import jsPDF from "jspdf"
import "jspdf-autotable"

interface DownloadInvoiceButtonProps {
    sale: Sale;
}

export function DownloadInvoiceButton({ sale }: DownloadInvoiceButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleDownload = async () => {
        setLoading(true)
        try {
            const doc = new jsPDF({
                unit: 'mm',
                format: [80, 150] // POS thermal format
            })

            const formattedDate = new Date(sale.tanggal).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })

            // Header
            doc.setFontSize(14)
            doc.text('FORBIS CIMANGGUNG', 40, 15, { align: 'center' })
            doc.setFontSize(8)
            doc.text('Koperasi Karyawan & Umum', 40, 20, { align: 'center' })
            doc.text('Jl. Raya Cimanggung No. 123', 40, 24, { align: 'center' })

            doc.setLineDashPattern([1, 1], 0)
            doc.line(5, 28, 75, 28)

            // Info
            doc.setFontSize(9)
            doc.text(`No. Trx: #${sale.id}`, 5, 35)
            doc.text(`Tanggal: ${formattedDate}`, 5, 40)
            doc.text(`Kategori: ${sale.kategori}`, 5, 45)

            doc.line(5, 48, 75, 48)

            // Items
            doc.setFont("helvetica", "bold")
            doc.text(sale.nama, 5, 55)
            doc.setFont("helvetica", "normal")
            doc.text(`${sale.jumlah} x Rp ${(sale.total_harga / sale.jumlah).toLocaleString('id-ID')}`, 5, 60)
            doc.text(`Rp ${sale.total_harga.toLocaleString('id-ID')}`, 75, 60, { align: 'right' })

            doc.line(5, 65, 75, 65)

            // Total
            doc.setFontSize(11)
            doc.setFont("helvetica", "bold")
            doc.text('TOTAL:', 5, 75)
            doc.text(`Rp ${sale.total_harga.toLocaleString('id-ID')}`, 75, 75, { align: 'right' })

            // Footer
            doc.setFontSize(8)
            doc.setFont("helvetica", "normal")
            doc.text('Terima Kasih Atas Kunjungan Anda', 40, 90, { align: 'center' })
            doc.text('Barang yang sudah dibeli tidak dapat ditukar', 40, 95, { align: 'center' })

            doc.save(`Invoice_${sale.id}_${sale.nama.replace(/\s+/g, '_')}.pdf`)
        } catch (error) {
            console.error('Failed to generate PDF:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={loading}
            className="h-8 px-2 text-xs gap-1 hover:bg-blue-50 hover:text-blue-600 border-blue-100 shadow-sm"
        >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
            PDF Invoice
        </Button>
    )
}
