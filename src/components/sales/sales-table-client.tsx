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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className={cn(
                    "text-xl font-bold px-4 py-2 rounded-lg border-l-4 shadow-sm inline-block whitespace-nowrap",
                    variant === 'orange' ? "bg-orange-500/10 text-orange-600 border-orange-500" : "bg-blue-500/10 text-blue-600 border-blue-500"
                )}>
                    {title}
                </h2>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <BulkDownloadInvoiceButton
                        sales={data}
                        kategori={kategori}
                        variant={variant}
                    />

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 shadow-md hover:scale-105 transition-transform flex-1 sm:flex-none bg-primary hover:bg-primary/90">
                                <Plus className="h-4 w-4" />
                                <span className="whitespace-nowrap">Entry {title.split(' ')[1]}</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            className="w-[95vw] sm:max-w-[600px] p-0 rounded-2xl border-border bg-card shadow-2xl overflow-hidden"
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
                            <div className="h-2 w-full rounded-t-2xl bg-primary" />
                            <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
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

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="min-w-[800px]">
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[120px] whitespace-nowrap">Tanggal</TableHead>
                                <TableHead className="whitespace-nowrap">Nama Barang</TableHead>
                                <TableHead className="text-center whitespace-nowrap">Jumlah</TableHead>
                                <TableHead className="text-right whitespace-nowrap">Total Harga</TableHead>
                                <TableHead className="text-right whitespace-nowrap">Laba</TableHead>
                                <TableHead className="text-center whitespace-nowrap">Invoice</TableHead>
                                <TableHead className="text-center whitespace-nowrap">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map((sale) => (
                                    <TableRow key={sale.id} className="group hover:bg-muted/50 transition-colors">
                                        <TableCell className="text-muted-foreground whitespace-nowrap">{sale.tanggal}</TableCell>
                                        <TableCell className="font-semibold text-foreground whitespace-nowrap">{sale.nama}</TableCell>
                                        <TableCell className="text-center">
                                            <span className="bg-muted px-2 py-1 rounded text-xs font-bold text-muted-foreground">
                                                {sale.jumlah}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-foreground whitespace-nowrap">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(sale.total_harga)}
                                        </TableCell>
                                        <TableCell className="text-right text-emerald-500 font-medium font-mono whitespace-nowrap">
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
        </div>
    );
}
