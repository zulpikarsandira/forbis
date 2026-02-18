'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BadgeCheck, AlertTriangle, XCircle, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { type Product, deleteProduct } from "@/lib/actions/products";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ProductForm } from "@/components/products/product-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ProductListTableProps {
    products: Product[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
}

export default function ProductListTable({ products, currentPage, totalPages, totalItems }: ProductListTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleDelete = async () => {
        if (!deletingProduct) return;

        setIsDeleting(true);
        const result = await deleteProduct(deletingProduct.id);
        setIsDeleting(false);

        if (result.success) {
            setDeletingProduct(null);
            // In a real app, we might trigger a toast here
        } else {
            alert(result.error || 'Gagal menghapus barang');
        }
    };

    return (
        <div>
            <Table>
                <TableHeader className="bg-gray-50/50">
                    <TableRow>
                        <TableHead className="w-[50px]">No</TableHead>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama Barang</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead className="text-right">Modal</TableHead>
                        <TableHead className="text-right">Harga Jual</TableHead>
                        <TableHead className="text-center">Stok</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                Tidak ada data barang.
                            </TableCell>
                        </TableRow>
                    ) : (
                        products.map((product, index) => (
                            <TableRow key={product.id}>
                                <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                                <TableCell className="font-mono text-xs text-gray-500">{product.kode}</TableCell>
                                <TableCell className="font-medium text-gray-900">{product.nama}</TableCell>
                                <TableCell className="text-gray-500">{product.jenis || '-'}</TableCell>
                                <TableCell className="text-right font-mono text-gray-600">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.modal)}
                                </TableCell>
                                <TableCell className="text-right font-bold text-gray-900">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.harga)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <StockBadge stok={product.jumlah} />
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                            onClick={() => setEditingProduct(product)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => setDeletingProduct(product)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                    <div className="text-sm text-gray-500">
                        Menampilkan {products.length} dari {totalItems} data
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            Previous
                        </Button>
                        <div className="text-sm font-medium">
                            Page {currentPage} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit Form Modal */}
            {editingProduct && (
                <ProductForm
                    product={editingProduct}
                    open={!!editingProduct}
                    onOpenChange={(open) => !open && setEditingProduct(null)}
                />
            )}

            {/* Delete Confirmation Modal */}
            <Dialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" /> Konfirmasi Hapus
                        </DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus barang <strong>{deletingProduct?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeletingProduct(null)} disabled={isDeleting}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Hapus Barang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StockBadge({ stok }: { stok: number }) {
    if (stok <= 3) {
        return <span className="badge-stock-danger text-xs">Habis ({stok})</span>;
    } else if (stok <= 10) {
        return <span className="badge-stock-warning text-xs">Waspada ({stok})</span>;
    } else {
        return <span className="badge-stock-safe text-xs">Aman ({stok})</span>;
    }
}
