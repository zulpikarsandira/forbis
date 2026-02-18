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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{product ? 'Edit Barang' : 'Tambah Barang Baru'}</DialogTitle>
                    <DialogDescription>
                        Isi form berikut untuk {product ? 'mengubah data' : 'menambahkan'} barang ke inventory.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="kode">Kode Barang</Label>
                            <Input
                                id="kode"
                                name="kode"
                                placeholder="BRG-001"
                                required
                                defaultValue={product?.kode}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="jenis">Jenis / Kategori</Label>
                            <Input
                                id="jenis"
                                name="jenis"
                                placeholder="Makanan"
                                defaultValue={product?.jenis || ''}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nama">Nama Barang</Label>
                        <Input
                            id="nama"
                            name="nama"
                            placeholder="Contoh: Kopi Kapal Api"
                            required
                            defaultValue={product?.nama}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="suplier">Suplier</Label>
                        <Input
                            id="suplier"
                            name="suplier"
                            placeholder="CV. Maju Jaya"
                            defaultValue={product?.suplier || ''}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="modal">Harga Modal</Label>
                            <Input
                                id="modal"
                                type="text"
                                placeholder="Rp 0"
                                required
                                value={formatIDR(modal)}
                                onChange={(e) => setModal(parseIDR(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="harga">Harga Jual</Label>
                            <Input
                                id="harga"
                                type="text"
                                placeholder="Rp 0"
                                required
                                value={formatIDR(harga)}
                                onChange={(e) => setHarga(parseIDR(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="jumlah">Stok Awal</Label>
                        <Input
                            id="jumlah"
                            name="jumlah"
                            type="number"
                            placeholder="0"
                            required
                            min="0"
                            defaultValue={product?.jumlah}
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm bg-red-50 p-2 rounded-lg text-center animate-in shake">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 duration-300">
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="font-semibold text-sm">Berhasil menyimpan barang! Jendela akan tertutup...</span>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-white border-0">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {product ? 'Simpan Perubahan' : 'Simpan Barang'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
