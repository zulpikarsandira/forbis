'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { createProduct, updateProduct, type Product } from '@/lib/actions/products';
import { formatIDR, parseIDR } from '@/lib/utils/format';

interface ProductFormProps {
    product?: Product;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ProductForm({ product, open: controlledOpen, onOpenChange: controlledOnOpenChange }: ProductFormProps) {
    const [localOpen, setLocalOpen] = useState(false);

    // Determine which state to use
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : localOpen;
    const setOpen = (val: boolean) => {
        if (controlledOnOpenChange) controlledOnOpenChange(val);
        if (!isControlled) setLocalOpen(val);
    };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [modal, setModal] = useState<number>(product?.modal || 0);
    const [harga, setHarga] = useState<number>(product?.harga || 0);

    // Sync state when product changes (e.g. when editing different products)
    useEffect(() => {
        if (product) {
            setModal(product.modal);
            setHarga(product.harga);
        } else {
            setModal(0);
            setHarga(0);
        }
    }, [product]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData(event.currentTarget);
        // Replace formatted strings with raw numeric values
        formData.set('modal', modal.toString());
        formData.set('harga', harga.toString());

        let result;
        if (product) {
            result = await updateProduct(product.id, formData);
        } else {
            result = await createProduct(formData);
        }

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);

            // Auto close after 1.5s
            setTimeout(() => {
                setSuccess(false);
                setOpen(false);
            }, 1500);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!product && (
                <DialogTrigger asChild>
                    <Button className="bg-gradient-primary gap-2 text-white shadow-lg shadow-blue-500/30 border-0">
                        <Plus className="h-4 w-4" /> Tambah Barang
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border bg-card shadow-2xl rounded-3xl">
                <div className="h-2 w-full bg-primary" />
                <div className="p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-foreground">{product ? 'Edit Barang' : 'Tambah Barang Baru'}</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Is i form berikut untuk {product ? 'mengubah data' : 'menambahkan'} barang ke inventory.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="kode" className="text-foreground font-semibold">Kode Barang</Label>
                                <Input
                                    id="kode"
                                    name="kode"
                                    placeholder="BRG-001"
                                    required
                                    defaultValue={product?.kode}
                                    className="bg-muted/50 border-border focus:ring-primary/20 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="jenis" className="text-foreground font-semibold">Jenis / Kategori</Label>
                                <Input
                                    id="jenis"
                                    name="jenis"
                                    placeholder="Makanan"
                                    defaultValue={product?.jenis || ''}
                                    className="bg-muted/50 border-border focus:ring-primary/20 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nama" className="text-foreground font-semibold">Nama Barang</Label>
                            <Input
                                id="nama"
                                name="nama"
                                placeholder="Contoh: Kopi Kapal Api"
                                required
                                defaultValue={product?.nama}
                                className="bg-muted/50 border-border focus:ring-primary/20 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="suplier" className="text-foreground font-semibold">Suplier</Label>
                            <Input
                                id="suplier"
                                name="suplier"
                                placeholder="CV. Maju Jaya"
                                defaultValue={product?.suplier || ''}
                                className="bg-muted/50 border-border focus:ring-primary/20 rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="modal" className="text-foreground font-semibold">Harga Modal</Label>
                                <Input
                                    id="modal"
                                    type="text"
                                    placeholder="Rp 0"
                                    required
                                    value={formatIDR(modal)}
                                    onChange={(e) => setModal(parseIDR(e.target.value))}
                                    className="bg-muted/50 border-border focus:ring-primary/20 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="harga" className="text-foreground font-semibold">Harga Jual</Label>
                                <Input
                                    id="harga"
                                    type="text"
                                    placeholder="Rp 0"
                                    required
                                    value={formatIDR(harga)}
                                    onChange={(e) => setHarga(parseIDR(e.target.value))}
                                    className="bg-muted/50 border-border focus:ring-primary/20 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jumlah" className="text-foreground font-semibold">Stok Awal</Label>
                            <Input
                                id="jumlah"
                                name="jumlah"
                                type="number"
                                placeholder="0"
                                required
                                min="0"
                                defaultValue={product?.jumlah}
                                className="bg-muted/50 border-border focus:ring-primary/20 rounded-xl"
                            />
                        </div>

                        {error && (
                            <div className="text-destructive text-sm bg-destructive/10 p-2 rounded-lg text-center animate-in shake">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-xl flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 duration-300">
                                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="font-semibold text-sm">Berhasil menyimpan barang! Jendela akan tertutup...</span>
                            </div>
                        )}

                        <DialogFooter className="pt-4 flex gap-3 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-xl h-12 border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                                Batal
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Save className="h-4 w-4" />
                                        {product ? 'Simpan Perubahan' : 'Simpan Barang'}
                                    </span>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
