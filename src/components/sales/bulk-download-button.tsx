"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Sale } from "@/lib/actions/sales"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { cn } from "@/lib/utils"

interface BulkDownloadInvoiceButtonProps {
    data: Sale[];
    kategori: string;
    variant: 'orange' | 'blue';
}

export function BulkDownloadInvoiceButton({ data, kategori, variant }: BulkDownloadInvoiceButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleDownload = async () => {
        if (data.length === 0) return

        setLoading(true)
        try {
            const doc = new jsPDF()
            const today = new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })

            // Header
            doc.setFontSize(18)
            doc.text('FORBIS CIMANGGUNG', 105, 15, { align: 'center' })
            doc.setFontSize(10)
            doc.text('Koperasi Karyawan & Umum', 105, 20, { align: 'center' })
            doc.text('Jl. Raya Cimanggung No. 123', 105, 25, { align: 'center' })

            doc.setLineWidth(0.5)
            doc.line(15, 30, 195, 30)

            // Title
            doc.setFontSize(14)
            doc.setFont("helvetica", "bold")
            doc.text(`LAPORAN PENJUALAN - ${kategori.toUpperCase()}`, 15, 40)

            doc.setFontSize(10)
            doc.setFont("helvetica", "normal")
            doc.text(`Tanggal Cetak: ${today}`, 15, 47)
            doc.text(`Total Transaksi: ${data.length}`, 15, 52)

            // Table
            const tableData = data.map((sale, index) => [
                index + 1,
                sale.tanggal,
                sale.nama,
                sale.jumlah,
                `Rp ${sale.total_harga.toLocaleString('id-ID')}`,
                `Rp ${sale.laba.toLocaleString('id-ID')}`
            ])

            const totalHarga = data.reduce((sum, item) => sum + item.total_harga, 0)
            const totalLaba = data.reduce((sum, item) => sum + item.laba, 0)

            // @ts-ignore
            autoTable(doc, {
                startY: 60,
                head: [['No', 'Tanggal', 'Nama Barang', 'Qty', 'Total Harga', 'Laba']],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: variant === 'orange' ? [249, 115, 22] : [37, 99, 235],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                foot: [[
                    '', '', 'TOTAL', '',
                    `Rp ${totalHarga.toLocaleString('id-ID')}`,
                    `Rp ${totalLaba.toLocaleString('id-ID')}`
                ]],
                footStyles: {
                    fillColor: [241, 245, 249],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold'
                }
            })

            // Footer
            // @ts-ignore
            const finalY = (doc as any).lastAutoTable.finalY + 10
            doc.setFontSize(9)
            doc.setFont("helvetica", "italic")
            doc.text('Dicetak secara otomatis oleh Sistem Forbis Cimanggung', 105, finalY + 10, { align: 'center' })

            doc.save(`Laporan_Penjualan_${kategori}_${new Date().toISOString().split('T')[0]}.pdf`)
        } catch (error) {
            console.error('Failed to generate PDF:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleDownload}
            disabled={loading || data.length === 0}
            variant="outline"
            className={cn(
                "gap-2 shadow-sm transition-all hover:scale-105",
                variant === 'orange'
                    ? "border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                    : "border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            )}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Cetak Laporan {kategori}
        </Button>
    )
}
