"use client"

import { useState } from "react"
import { FileDown, Loader2, FileSpreadsheet, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import ExcelJS from "exceljs"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { applyExcelHeader, applyPDFHeader, getLogoBase64 } from "@/lib/export-utils"
import { type Sale } from "@/lib/actions/sales"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BulkDownloadInvoiceButtonProps {
    sales: Sale[]
    kategori: 'Warung' | 'Dapur'
    variant?: 'orange' | 'blue'
    className?: string
}

export function BulkDownloadInvoiceButton({
    sales,
    kategori,
    variant = 'blue',
    className
}: BulkDownloadInvoiceButtonProps) {
    const [loading, setLoading] = useState(false)

    const exportExcel = async () => {
        setLoading(true)
        try {
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet(`Invoices ${kategori}`)
            const logoBase64 = await getLogoBase64()

            const columns = [
                { header: 'No', key: 'no', width: 5 },
                { header: 'Tanggal', key: 'tanggal', width: 15 },
                { header: 'Nama Barang', key: 'nama_barang', width: 30 },
                { header: 'Qty', key: 'qty', width: 8 },
                { header: 'Harga', key: 'harga', width: 15 },
                { header: 'Total Harga', key: 'total', width: 15 },
            ];

            const startRow = applyExcelHeader(workbook, worksheet, `INVOICE`, columns, logoBase64)

            // Styling Header Table (Row startRow)
            const headerRow = worksheet.getRow(startRow);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: variant === 'orange' ? 'FFF97316' : 'FF2563EB' }
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

            // Data rows
            sales.forEach((sale, index) => {
                const row = worksheet.addRow({
                    no: index + 1,
                    tanggal: sale.tanggal,
                    nama_barang: sale.nama,
                    qty: sale.jumlah,
                    harga: sale.total_harga / sale.jumlah,
                    total: sale.total_harga,
                })

                // Add borders and formatting
                row.eachCell((cell, colNumber) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    }
                    if (colNumber >= 5) {
                        cell.numFmt = '#,##0'
                        cell.alignment = { horizontal: 'right' }
                    }
                })
            })

            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Invoices_${kategori}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
            a.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Excel Export Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const exportPDF = async () => {
        setLoading(true)
        try {
            const doc = new jsPDF()
            const logoBase64 = await getLogoBase64()

            const startY = applyPDFHeader(doc, `INVOICE`, logoBase64)
            const invoiceNo = `INV-${Date.now().toString().slice(-6)}`
            const totalSum = sales.reduce((acc, sale) => acc + sale.total_harga, 0)
            const totalQtySum = sales.reduce((acc, sale) => acc + sale.jumlah, 0)

            doc.setFontSize(10)
            doc.text(`No. Invoice: ${invoiceNo}`, 14, startY)
            doc.text(`Tanggal Cetak: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`, 14, startY + 5)

            autoTable(doc, {
                startY: startY + 10,
                head: [['No', 'Tanggal', 'Nama Barang', 'Qty', 'Harga', 'Total']],
                body: sales.map((sale, index) => [
                    index + 1,
                    sale.tanggal,
                    sale.nama,
                    sale.jumlah,
                    (sale.total_harga / sale.jumlah).toLocaleString('id-ID'),
                    sale.total_harga.toLocaleString('id-ID')
                ]),
                foot: [[
                    { content: 'TOTAL KESELURUHAN', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0] } },
                    { content: totalQtySum.toString(), styles: { halign: 'center', fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0] } },
                    { content: '', styles: { fillColor: [240, 240, 240] } },
                    { content: `Rp ${totalSum.toLocaleString('id-ID')}`, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0] } }
                ]],
                theme: 'grid',
                headStyles: {
                    fillColor: variant === 'orange' ? [249, 115, 22] : [37, 99, 235],
                },
                styles: { fontSize: 8, lineColor: [200, 200, 200], lineWidth: 0.1 }
            })

            const finalY = (doc as any).lastAutoTable.finalY || startY + 50
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.text('Terima Kasih Atas Kunjungan Anda', 105, finalY + 15, { align: 'center' })

            doc.save(`Invoice_${kategori}_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
        } catch (error) {
            console.error('PDF Export Error:', error)
        } finally {
            setLoading(false)
        }
    }
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={className}
                    disabled={loading || sales.length === 0}
                >
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <FileDown className="mr-2 h-4 w-4" />
                    )}
                    Export {kategori}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-border bg-card">
                <DropdownMenuLabel>Pilih Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportExcel} className="gap-2 cursor-pointer font-medium hover:bg-green-50 hover:text-green-600 transition-colors">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Export Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportPDF} className="gap-2 cursor-pointer font-medium hover:bg-red-50 hover:text-red-700 transition-colors">
                    <FileText className="h-4 w-4 text-red-600" />
                    Export PDF
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
