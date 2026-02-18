"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getProducts, type Product } from "@/lib/actions/products"
import { Input } from "@/components/ui/input"

interface ProductComboboxProps {
    onSelect: (product: Product) => void;
}

export function ProductCombobox({ onSelect }: ProductComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const [allProducts, setAllProducts] = React.useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = React.useState<Product[]>([])
    const [loading, setLoading] = React.useState(false)
    const [hasFetched, setHasFetched] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Initial fetch of a larger batch for speed
    React.useEffect(() => {
        if (!open || hasFetched) return;

        setLoading(true);
        getProducts('', 1, 200).then((res) => {
            setAllProducts(res.data);
            setFilteredProducts(res.data);
            setLoading(false);
            setHasFetched(true);
        }).catch(() => setLoading(false));
    }, [open, hasFetched]);

    // Fast client-side filtering
    React.useEffect(() => {
        if (!search) {
            setFilteredProducts(allProducts);
            return;
        }

        const filtered = allProducts.filter(p =>
            p.nama.toLowerCase().includes(search.toLowerCase()) ||
            p.kode.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredProducts(filtered);
    }, [search, allProducts]);

    return (
        <div className="relative w-full" ref={containerRef}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between bg-white text-left font-normal"
                onClick={() => setOpen(!open)}
            >
                <span className="truncate">
                    {search || "Pilih barang..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border rounded-xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b bg-gray-50 flex items-center gap-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <input
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                            placeholder="Ketik nama atau kode..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setOpen(false);
                                e.stopPropagation(); // Don't let Dialog handle escapes initially
                            }}
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                        {loading && filteredProducts.length === 0 ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                <span className="ml-2 text-sm text-gray-500 font-medium">Mencari barang...</span>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-400 italic">
                                Barang tidak ditemukan.
                            </div>
                        ) : (
                            <div className="p-1">
                                {filteredProducts.map((product: Product) => (
                                    <button
                                        key={product.kode}
                                        type="button"
                                        className="w-full flex flex-col items-start p-3 rounded-lg hover:bg-blue-50 text-left transition-colors group border-b border-gray-50 last:border-0"
                                        onClick={(e) => {
                                            console.log("Product clicked:", product.nama);
                                            onSelect(product);
                                            setSearch(product.nama);
                                            setOpen(false);
                                            // Explicitly prevent bubbling to Dialog
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                    >
                                        <div className="flex w-full justify-between items-center mb-1">
                                            <span className="font-bold text-gray-900 group-hover:text-blue-700">{product.nama}</span>
                                            <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                                {product.kode}
                                            </span>
                                        </div>
                                        <div className="flex w-full justify-between text-[11px] text-gray-500">
                                            <span>Stok: <span className={cn("font-bold", product.jumlah > 10 ? "text-green-600" : "text-red-500")}>{product.jumlah}</span></span>
                                            <span className="font-mono text-blue-600 font-semibold">
                                                Rp {product.harga.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
