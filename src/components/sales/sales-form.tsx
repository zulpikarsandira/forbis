'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductCombobox } from './product-combobox';
import { createSale, type Sale } from '@/lib/actions/sales';
import { Loader2, Save } from 'lucide-react';
import { type Product } from '@/lib/actions/products';
import { cn } from "@/lib/utils";
import { formatIDR, parseIDR } from '@/lib/utils/format';

interface SalesFormProps {
    defaultKategori?: 'Dapur' | 'Warung';
    onSuccess?: () => void;
    showCloseButton?: boolean;
}

export function SalesForm({ defaultKategori, onSuccess }: SalesFormProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [jumlah, setJumlah] = useState(0.1);
    const [hargaJual, setHargaJual] = useState(0);
    const [hargaBeli, setHargaBeli] = useState(0);
    const [date, setDate] = useState(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date()));
    const [kategori, setKategori] = useState<'Dapur' | 'Warung'>(defaultKategori || 'Warung');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        setHargaJual(product.harga);
        setHargaBeli(product.modal);
        setJumlah(0.1);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) {
            setError('Pilih barang terlebih dahulu!');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData();
        formData.append('nama', selectedProduct.nama);
        formData.append('jumlah', jumlah.toString());
        formData.append('harga_jual', hargaJual.toString());
        formData.append('tanggal', date);
        formData.append('modal_per_item', hargaBeli.toString());
        formData.append('kategori', kategori);

        const result = await createSale(formData);

        if (result?.error) {
            setError(result.error);
        } else {
            setSuccess(true);
            // Reset form partly
            setSelectedProduct(null);
            setJumlah(0.1);
            setHargaJual(0);

            // Clear inputs if they're uncontrolled by state in a way that matters
            // but here we are using controlled components mostly

            // Auto hide success message
            setTimeout(() => {
                setSuccess(false);
                if (onSuccess) onSuccess();
            }, 1500);
        }
        setLoading(false);
    };

    return (
        <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-blue-700">Input Penjualan - {kategori}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tanggal Transaksi</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Cari Barang</Label>
                            <ProductCombobox onSelect={handleProductSelect} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Kategori Penjualan</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={kategori === 'Dapur' ? 'default' : 'outline'}
                                className={cn(
                                    "flex-1 py-6 h-auto text-lg font-bold transition-all",
                                    kategori === 'Dapur'
                                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md border-0"
                                        : "hover:bg-orange-50 hover:text-orange-600 border-orange-200"
                                )}
                                onClick={() => setKategori('Dapur')}
                            >
                                Penjualan Dapur
                            </Button>
                            <Button
                                type="button"
                                variant={kategori === 'Warung' ? 'default' : 'outline'}
                                className={cn(
                                    "flex-1 py-6 h-auto text-lg font-bold transition-all",
                                    kategori === 'Warung'
                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md border-0"
                                        : "hover:bg-blue-50 hover:text-blue-600 border-blue-200"
                                )}
                                onClick={() => setKategori('Warung')}
                            >
                                Penjualan Warung
                            </Button>
                        </div>
                    </div>

                    {selectedProduct && (
                        <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex flex-col md:flex-row gap-4 items-end animate-in fade-in slide-in-from-top-2">
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs text-gray-500">Barang Terpilih</Label>
                                <div className="font-medium text-lg">{selectedProduct.nama}</div>
                                <div className="text-sm text-gray-500">Stok Tersedia: <span className="font-bold text-blue-600">{selectedProduct.jumlah}</span></div>
                            </div>

                            <div className="w-full md:w-32 space-y-2">
                                <Label>Harga Beli</Label>
                                <Input
                                    type="text"
                                    value={formatIDR(hargaBeli)}
                                    onChange={(e) => setHargaBeli(parseIDR(e.target.value))}
                                    className="text-right font-mono text-orange-600"
                                />
                            </div>

                            <div className="w-full md:w-32 space-y-2">
                                <Label>Harga Jual</Label>
                                <Input
                                    type="text"
                                    value={formatIDR(hargaJual)}
                                    onChange={(e) => setHargaJual(parseIDR(e.target.value))}
                                    className="text-right font-mono"
                                />
                            </div>

                            <div className="w-full md:w-20 space-y-2">
                                <Label>Jumlah</Label>
                                <Input
                                    type="number"
                                    value={jumlah}
                                    onChange={(e) => setJumlah(Number(e.target.value))}
                                    min="0.1"
                                    step="0.1"
                                    max={selectedProduct.jumlah}
                                    className="text-center font-bold px-1"
                                />
                            </div>
                        </div>
                    )}

                    {selectedProduct && (
                        <div className="flex justify-between items-center pt-2 border-t">
                            <div className="text-sm text-gray-500">
                                Total: {' '}
                                <span className="text-lg font-bold text-gray-900">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(hargaJual * jumlah)}
                                </span>
                            </div>

                            <Button type="submit" disabled={loading || jumlah > selectedProduct.jumlah} className="bg-gradient-success border-0 px-8">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Simpan Transaksi
                            </Button>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium animate-in shake">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-3 bg-green-50 text-green-700 p-4 rounded-2xl border border-green-100 animate-in fade-in zoom-in duration-300">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Save className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="font-bold">Transaksi Berhasil!</p>
                                <p className="text-xs text-green-600/80">Data telah disimpan ke sistem.</p>
                            </div>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
