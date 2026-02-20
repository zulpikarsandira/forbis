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
import { BadgeCheck, AlertTriangle, XCircle, Edit, Trash2, Eye, Loader2, X } from "lucide-react";
import { type Product, deleteProduct, bulkDeleteProducts, deleteAllProducts } from "@/lib/actions/products";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ProductForm } from "@/components/products/product-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

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

    // Bulk Delete State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isSelectAllMode, setIsSelectAllMode] = useState(false); // Mode where ALL items across pages are selected
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    // Reset selection when products change (e.g. pagination), unless in global select all mode
    useEffect(() => {
        if (!isSelectAllMode) {
            setSelectedIds([]);
        }
    }, [products, isSelectAllMode]);

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
        } else {
            alert(result.error || 'Gagal menghapus barang');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0 && !isSelectAllMode) return;

        setIsBulkDeleting(true);

        let result;
        if (isSelectAllMode) {
            result = await deleteAllProducts();
        } else {
            result = await bulkDeleteProducts(selectedIds);
        }

        setIsBulkDeleting(false);

        if (result.success) {
            setShowBulkDeleteConfirm(false);
            setSelectedIds([]);
            setIsSelectAllMode(false);
        } else {
            alert(result.error || 'Gagal menghapus barang');
        }
    };

    const toggleSelectAllPage = () => {
        if (isSelectAllMode) {
            setIsSelectAllMode(false);
            setSelectedIds([]);
            return;
        }

        if (selectedIds.length === products.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.map(p => p.id));
        }
    };

    const selectAllGlobal = () => {
        setIsSelectAllMode(true);
        setSelectedIds(products.map(p => p.id)); // Visually select current page too
    };

    const clearSelection = () => {
        setIsSelectAllMode(false);
        setSelectedIds([]);
    }

    const toggleSelectOne = (id: number) => {
        if (isSelectAllMode) {
            // If we are in global mode, deselection is tricky logic-wise. 
            // For simplicity, let's disable individual deselection in global mode OR 
            // revert to page-based selection. 
            // Let's revert to page-based selection but keep others selected? No, easier to just reset.
            setIsSelectAllMode(false);
            setSelectedIds([]); // Or keep current page selected
            return;
        }

        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const isAllPageSelected = products.length > 0 && selectedIds.length === products.length;

    return (
        <div className="space-y-4">
            {/* Bulk Actions Bar */}
            {(selectedIds.length > 0 || isSelectAllMode) && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <BadgeCheck className="h-5 w-5" />
                            <span className="font-medium">
                                {isSelectAllMode
                                    ? `Semua ${totalItems} barang terpilih`
                                    : `${selectedIds.length} barang terpilih`}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {isSelectAllMode ? (
                                <Button size="sm" variant="ghost" onClick={clearSelection} className="text-red-600 hover:text-red-700 hover:bg-red-500/10">
                                    Batalkan
                                </Button>
                            ) : null}
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowBulkDeleteConfirm(true)}
                                className="shadow-sm"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus {isSelectAllMode ? 'Semua' : 'Terpilih'}
                            </Button>
                        </div>
                    </div>

                    {/* "Select All Global" Prompt */}
                    {!isSelectAllMode && isAllPageSelected && totalItems > products.length && (
                        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-center text-sm text-blue-600 dark:text-blue-400">
                            <span>Baru {selectedIds.length} barang di halaman ini yang terpilih. </span>
                            <button
                                onClick={selectAllGlobal}
                                className="font-bold underline hover:text-blue-900 focus:outline-none"
                            >
                                Pilih semua {totalItems} barang di database?
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-card rounded-[2rem] shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-muted">
                            <TableRow>
                                <TableHead className="w-[50px] text-center">
                                    <Checkbox
                                        checked={isAllPageSelected || isSelectAllMode}
                                        onCheckedChange={toggleSelectAllPage}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead className="w-[50px]">No</TableHead>
                                <TableHead className="whitespace-nowrap">Kode</TableHead>
                                <TableHead className="whitespace-nowrap">Nama Barang</TableHead>
                                <TableHead className="whitespace-nowrap">Jenis</TableHead>
                                <TableHead className="text-right whitespace-nowrap">Modal</TableHead>
                                <TableHead className="text-right whitespace-nowrap">Harga Jual</TableHead>
                                <TableHead className="text-center whitespace-nowrap">Stok</TableHead>
                                <TableHead className="text-center whitespace-nowrap">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                        Tidak ada data barang.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product, index) => (
                                    <TableRow key={product.id} className={(selectedIds.includes(product.id) || isSelectAllMode) ? "bg-primary/10" : "hover:bg-muted/50 transition-colors"}>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={selectedIds.includes(product.id) || isSelectAllMode}
                                                onCheckedChange={() => toggleSelectOne(product.id)}
                                                aria-label={`Select ${product.nama}`}
                                            />
                                        </TableCell>
                                        <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{product.kode}</TableCell>
                                        <TableCell className="font-medium text-foreground whitespace-nowrap">{product.nama}</TableCell>
                                        <TableCell className="text-muted-foreground whitespace-nowrap">{product.jenis || '-'}</TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground whitespace-nowrap">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.modal)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-foreground whitespace-nowrap">
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
                                                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                                                    onClick={() => setEditingProduct(product)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
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
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
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

            {/* Delete Confirmation Modal (Single) */}
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

            {/* Bulk Delete Confirmation Modal */}
            <Dialog open={showBulkDeleteConfirm} onOpenChange={(open) => !open && setShowBulkDeleteConfirm(false)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" /> Konfirmasi Hapus Banyak
                        </DialogTitle>
                        <DialogDescription>
                            {isSelectAllMode ? (
                                <span>Apakah Anda yakin ingin menghapus <strong>SEMUA {totalItems} DATA BARANG</strong> di database? Tindakan ini sangat berbahaya dan tidak dapat dibatalkan.</span>
                            ) : (
                                <span>Apakah Anda yakin ingin menghapus <strong>{selectedIds.length} barang terpilih</strong>? Tindakan ini tidak dapat dibatalkan.</span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowBulkDeleteConfirm(false)} disabled={isBulkDeleting}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                            {isBulkDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            {isSelectAllMode ? 'Hapus SEMUA Data' : `Hapus ${selectedIds.length} Barang`}
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
