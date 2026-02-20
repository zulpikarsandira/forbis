'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2, FileSpreadsheet, FileText } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { cn } from "@/lib/utils"
import ExcelJS from 'exceljs'
import { applyExcelHeader, applyPDFHeader, getLogoBase64 } from "@/lib/export-utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SaleItem {
    id: string
    nama_barang: string
    jumlah: number
    harga_satuan: number
    total_harga: number
}

interface Sale {
    id: string
    nama: string
    tanggal: string
    items: SaleItem[]
    total_harga: number
}

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

    const exportPDF = async () => {
        setLoading(true)
        try {
            const doc = new jsPDF()
            const tableData = sales.flatMap((sale, saleIndex) =>
                sale.items.map((item, itemIndex) => [
                    itemIndex === 0 ? saleIndex + 1 : "",
                    itemIndex === 0 ? new Date(sale.tanggal).toLocaleDateString('id-ID') : "",
                    item.nama_barang,
                    item.jumlah,
                    new Intl.NumberFormat('id-ID').format(item.harga_satuan),
                    new Intl.NumberFormat('id-ID').format(item.total_harga)
                ])
            )

            const printNumber = `INV-${Date.now().toString().slice(-6)}`
            const logoBase64 = await getLogoBase64();

            const startY = applyPDFHeader(doc, `INVOICE`, logoBase64)

            doc.setFontSize(10)
            doc.setFont("helvetica", "normal")
            doc.text(`No. Cetak: ${printNumber}`, 15, startY)
            doc.text(`Kategori: ${kategori}`, 15, startY + 5)
            doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 15, startY + 10)

            autoTable(doc, {
                startY: startY + 15,
                head: [['No', 'Tanggal', 'Nama Barang', 'Qty', 'Harga', 'Total Harga']],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: variant === 'orange' ? [249, 115, 22] : [37, 99, 235],
                },
                styles: { fontSize: 8, lineColor: [200, 200, 200], lineWidth: 0.1 }
            })

            doc.save(`Invoice_Bulk_${kategori}_${new Date().toISOString().split('T')[0]}.pdf`)
        } catch (error) {
            console.error("PDF Export error:", error)
        } finally {
            setLoading(false)
        }
    }

    const exportExcel = async () => {
        setLoading(true)
        try {
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet(`Laporan ${kategori}`)
            const logoBase64 = await getLogoBase64();

            const columns = [
                { header: 'No', key: 'no', width: 5 },
                { header: 'Tanggal', key: 'tanggal', width: 15 },
                { header: 'Nama Barang', key: 'nama_barang', width: 30 },
                { header: 'Qty', key: 'qty', width: 8 },
                { header: 'Harga', key: 'harga', width: 15 },
                { header: 'Total Harga', key: 'total', width: 15 },
            ];

            const startRow = applyExcelHeader(workbook, worksheet, `INVOICE`, columns, logoBase64)

            // Styling Header
            const headerRow = worksheet.getRow(startRow)
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: variant === 'orange' ? 'FFF97316' : 'FF2563EB' }
            }
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

            let saleCounter = 1
            sales.forEach((sale) => {
                sale.items.forEach((item, itemIndex) => {
                    const row = worksheet.addRow({
                        no: itemIndex === 0 ? saleCounter : "",
                        tanggal: itemIndex === 0 ? new Date(sale.tanggal).toLocaleDateString('id-ID') : "",
                        nama_barang: item.nama_barang,
                        qty: item.jumlah,
                        harga: item.harga_satuan,
                        total: item.total_harga
                    })

                    row.eachCell((cell, colNumber) => {
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
                        if (colNumber === 5 || colNumber === 6) {
                            cell.numFmt = '#,##0'
                            cell.alignment = { horizontal: 'right' }
                        }
                    })
                })
                saleCounter++
            })

            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Invoice_Bulk_${kategori}_${new Date().toISOString().split('T')[0]}.xlsx`
            a.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Excel Export error:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "gap-2 rounded-xl transition-all",
                        variant === 'orange'
                            ? "border-orange-200 hover:bg-orange-50 text-orange-700"
                            : "border-blue-200 hover:bg-blue-50 text-blue-700",
                        className
                    )}
                    disabled={loading || sales.length === 0}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <FileDown className="h-4 w-4" />
                    )}
                    Export {kategori}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuLabel>Pilih Format Export</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportExcel} className="gap-2 cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Export Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportPDF} className="gap-2 cursor-pointer">
                    <FileText className="h-4 w-4 text-red-600" />
                    Export PDF (.pdf)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
