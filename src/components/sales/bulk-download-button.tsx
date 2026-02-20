"use client"

import { useState } from "react"
import { FileDown, Loader2, FileSpreadsheet, FileText, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Sale } from "@/lib/actions/sales"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { cn } from "@/lib/utils"
import ExcelJS from 'exceljs'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

            const printNumber = `INV-${Date.now().toString().slice(-6)}`

            // Header
            doc.setFontSize(18)
            doc.text('FORBIS CIMANGGUNG', 105, 15, { align: 'center' })
            doc.setFontSize(10)
            doc.text('Koperasi Karyawan & Umum', 105, 20, { align: 'center' })
            doc.text('Jl. Raya Cimanggung No. 123', 105, 25, { align: 'center' })

            doc.setLineWidth(0.5)
            doc.line(15, 30, 195, 30)

            // Title
            doc.setFontSize(16)
            doc.setFont("helvetica", "bold")
            doc.text('INVOICE', 105, 42, { align: 'center' })

            doc.setFontSize(10)
            doc.setFont("helvetica", "normal")
            doc.text(`No. Cetak: ${printNumber}`, 15, 50)
            doc.text(`Kategori: ${kategori}`, 15, 55)
            doc.text(`Tanggal Cetak: ${today}`, 195, 50, { align: 'right' })
            doc.text(`Total Transaksi: ${data.length}`, 195, 55, { align: 'right' })

            // Table
            const tableData = data.map((sale, index) => [
                index + 1,
                sale.tanggal,
                sale.nama,
                sale.jumlah,
                `Rp ${sale.jumlah > 0 ? Math.round(sale.total_harga / sale.jumlah).toLocaleString('id-ID') : 0}`,
                `Rp ${sale.total_harga.toLocaleString('id-ID')}`
            ])

            const totalHarga = data.reduce((sum, item) => sum + item.total_harga, 0)

            // @ts-ignore
            autoTable(doc, {
                startY: 60,
                head: [['No', 'Tanggal', 'Nama Barang', 'Qty', 'Harga', 'Total Harga']],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: variant === 'orange' ? [249, 115, 22] : [37, 99, 235],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                foot: [[
                    '', '', 'TOTAL', '', '',
                    `Rp ${totalHarga.toLocaleString('id-ID')}`
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
            alert('Gagal export PDF.')
        } finally {
            setLoading(false)
        }
    }

    const handleExcelExport = async () => {
        if (data.length === 0) return
        setLoading(true)
        try {
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet(`Laporan ${kategori}`)

            // Headers
            worksheet.columns = [
                { header: 'No', key: 'no', width: 5 },
                { header: 'Tanggal', key: 'tanggal', width: 15 },
                { header: 'Nama Barang', key: 'nama', width: 30 },
                { header: 'Qty', key: 'jumlah', width: 10 },
                { header: 'Harga', key: 'harga', width: 15 },
                { header: 'Total Harga', key: 'total', width: 15 },
            ]

            // Styling Header
            const headerRow = worksheet.getRow(1)
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: variant === 'orange' ? 'FFF97316' : 'FF2563EB' }
            }
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

            // Data
            data.forEach((sale, index) => {
                const row = worksheet.addRow({
                    no: index + 1,
                    tanggal: sale.tanggal,
                    nama: sale.nama,
                    jumlah: sale.jumlah,
                    harga: sale.jumlah > 0 ? Math.round(sale.total_harga / sale.jumlah) : 0,
                    total: sale.total_harga
                })

                // Borders & Alignment
                row.eachCell((cell, colNumber) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    }
                    if (colNumber === 1 || colNumber === 4) {
                        cell.alignment = { horizontal: 'center' }
                    } else if (colNumber >= 5) {
                        cell.numFmt = '#,##0'
                        cell.alignment = { horizontal: 'right' }
                    }
                })
            })

            // Totals
            const totalHarga = data.reduce((sum, item) => sum + item.total_harga, 0)

            const totalRow = worksheet.addRow({
                no: '',
                tanggal: '',
                nama: 'TOTAL',
                jumlah: '',
                harga: '',
                total: totalHarga
            })

            totalRow.eachCell((cell, colNumber) => {
                cell.font = { bold: true }
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
                if (colNumber >= 5) {
                    cell.numFmt = '#,##0'
                    cell.alignment = { horizontal: 'right' }
                }
            })
            worksheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`)


            // Download
            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `Laporan_Penjualan_${kategori}_${new Date().toISOString().split('T')[0]}.xlsx`
            link.click()
            window.URL.revokeObjectURL(url)

        } catch (error) {
            console.error('Excel export failed:', error)
            alert('Gagal export excel.')
        } finally {
            setLoading(false)
        }
    }


    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
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
                    Cetak Laporan {kategori} <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Pilih Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExcelExport}>
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /> Export Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                    <FileText className="mr-2 h-4 w-4 text-red-600" /> Export PDF (.pdf)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
