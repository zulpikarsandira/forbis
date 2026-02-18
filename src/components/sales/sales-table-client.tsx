"use client"

import { useState } from "react"
import { Plus, ReceiptText } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { SalesForm } from "@/components/sales/sales-form"
import { DeleteSaleButton } from "@/app/dashboard/sales/delete-button"
import { PrintInvoiceButton } from "@/components/sales/print-invoice-button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { DownloadInvoiceButton } from './download-invoice-button';
import { BulkDownloadInvoiceButton } from './bulk-download-button';
import { deleteSale, type Sale } from '@/lib/actions/sales';
import { cn } from "@/lib/utils"

interface SalesTableClientProps {
    data: Sale[];
    title: string;
    variant: 'orange' | 'blue';
    kategori: 'Dapur' | 'Warung';
}

export function SalesTableClient({ data, title, variant, kategori }: SalesTableClientProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className={cn(
                    "text-xl font-bold px-4 py-2 rounded-lg border-l-4 shadow-sm inline-block",
                    variant === 'orange' ? "bg-orange-50 text-orange-700 border-orange-500" : "bg-blue-50 text-blue-700 border-blue-500"
                )}>
                    {title}
                </h2>

                <div className="flex gap-2">
                    <BulkDownloadInvoiceButton
                        data={data}
                        kategori={kategori}
                        variant={variant}
                    />

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className={cn(
                                "gap-2 shadow-md hover:scale-105 transition-transform",
                                variant === 'orange' ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"
                            )}>
                                <Plus className="h-4 w-4" />
                                Tambah Entry {title.split(' ')[1]}
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            className="sm:max-w-[600px] p-0 rounded-2xl border-0 shadow-2xl"
                            onInteractOutside={(e) => {
                                // If we are clicking inside a popover (like product list), don't close the dialog
                                const isPopover = (e.target as HTMLElement)?.closest('[role="combobox"]') ||
                                    (e.target as HTMLElement)?.closest('[cmdk-list-wrapper]');
                                if (isPopover) {
                                    e.preventDefault();
                                }
                            }}
                        >
                            <DialogHeader className="sr-only">
                                <DialogTitle>Tambah Entry Penjualan - {kategori}</DialogTitle>
                                <DialogDescription>
                                    Input data transaksi untuk kategori {kategori}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className={cn(
                                "h-2 w-full rounded-t-2xl",
                                variant === 'orange' ? "bg-orange-500" : "bg-blue-600"
                            )} />
                            <div className="p-6">
                                <SalesForm
                                    defaultKategori={kategori}
                                    onSuccess={() => {
                                        // Wait a bit for the user to see the success message in SalesForm
                                        // before closing the dialog
                                        setTimeout(() => setOpen(false), 2000);
                                    }}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-100/50">
                        <TableRow>
                            <TableHead className="w-[120px]">Tanggal</TableHead>
                            <TableHead>Nama Barang</TableHead>
                            <TableHead className="text-center">Jumlah</TableHead>
                            <TableHead className="text-right">Total Harga</TableHead>
                            <TableHead className="text-right">Laba</TableHead>
                            <TableHead className="text-center">Invoice</TableHead>
                            <TableHead className="text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? (
                            data.map((sale) => (
                                <TableRow key={sale.id} className="group hover:bg-gray-50/50">
                                    <TableCell className="text-gray-500">{sale.tanggal}</TableCell>
                                    <TableCell className="font-semibold text-gray-900">{sale.nama}</TableCell>
                                    <TableCell className="text-center">
                                        <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">
                                            {sale.jumlah}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(sale.total_harga)}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600 font-medium font-mono">
                                        +{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(sale.laba)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <DownloadInvoiceButton sale={sale} />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <DeleteSaleButton id={sale.id} nama={sale.nama} jumlah={sale.jumlah} />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
                                    <div className="flex flex-col items-center gap-2">
                                        <ReceiptText className="h-8 w-8 opacity-20" />
                                        <span>Belum ada transaksi di kategori ini.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
