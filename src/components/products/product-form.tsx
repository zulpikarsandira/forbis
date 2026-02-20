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
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-border bg-card shadow-2xl rounded-3xl">
                <div className="h-2 w-full bg-primary" />
                <div className="p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-foreground">
                            {product ? 'Edit Barang' : 'Tambah Barang Baru'}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {product ? 'Update informasi barang di database.' : 'Masukkan detail barang untuk menambah stok baru.'}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="nama"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground font-semibold">Nama Barang</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contoh: Basreng Original" {...field} className="bg-muted/50 border-border focus:ring-primary/20 rounded-xl" />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="jenis"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground font-semibold">Kategori/Jenis</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contoh: Snack" {...field} className="bg-muted/50 border-border focus:ring-primary/20 rounded-xl" />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="kode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground font-semibold">Kode Barang</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input {...field} className="bg-muted/50 border-border focus:ring-primary/20 rounded-xl font-mono" />
                                                {product && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border uppercase">Read Only</div>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="modal"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground font-semibold">Harga Modal</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="bg-muted/50 border-border focus:ring-primary/20 rounded-xl" onChange={e => field.onChange(Number(e.target.value))} />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="harga"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground font-semibold">Harga Jual</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="bg-muted/50 border-border focus:ring-primary/20 rounded-xl" onChange={e => field.onChange(Number(e.target.value))} />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="jumlah"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground font-semibold">Stok Saat Ini</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} className="bg-muted/50 border-border focus:ring-primary/20 rounded-xl" onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl h-12 border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Menyimpan...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Save className="h-4 w-4" />
                                            {product ? 'Update Barang' : 'Simpan Barang'}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
