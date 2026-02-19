"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Search, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { getProducts, type Product } from "@/lib/actions/products"

interface ProductComboboxProps {
    onSelect: (product: Product) => void;
}

export function ProductCombobox({ onSelect }: ProductComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const [search, setSearch] = React.useState("")
    const [products, setProducts] = React.useState<Product[]>([])
    const [loading, setLoading] = React.useState(false)

    // Initial fetch
    React.useEffect(() => {
        if (!open) return; // Only fetch when opened

        setLoading(true);
        // Fetch products.
        // Let's refetch every time it opens to ensure freshness, or use a comprehensive strategy.
        // For now, refetching on open is safer for "deleted items" issue.

        getProducts('', 1, 1000).then((res) => { // Increased limit to ensure we get all for search
            setProducts(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [open]);

    const handleSelect = (product: Product) => {
        setValue(product.nama);
        onSelect(product);
        setOpen(false);
        setSearch(""); // Reset search after selection
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-white text-left font-normal"
                >
                    <span className="truncate">
                        {value ? value : "Pilih barang..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0" align="start">
                <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Cari nama atau kode..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <CommandList className="max-h-[400px]">
                        {loading ? (
                            <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Memuat data...
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                                <AlertCircle className="h-8 w-8 text-yellow-500 mb-2" />
                                <p className="text-sm font-medium text-gray-900">Tidak ada data barang.</p>
                                <p className="text-xs text-gray-500 mt-1">Silakan input data barang terlebih dahulu di halaman Data Barang.</p>
                            </div>
                        ) : (
                            <>
                                {products.filter(p =>
                                    !search ||
                                    p.nama.toLowerCase().includes(search.toLowerCase()) ||
                                    p.kode.toLowerCase().includes(search.toLowerCase())
                                ).length === 0 && (
                                        <CommandEmpty>Barang tidak ditemukan.</CommandEmpty>
                                    )}
                                <CommandGroup>
                                    {products
                                        .filter(product =>
                                            !search ||
                                            product.nama.toLowerCase().includes(search.toLowerCase()) ||
                                            product.kode.toLowerCase().includes(search.toLowerCase())
                                        )
                                        .map((product) => (
                                            <CommandItem
                                                key={product.id}
                                                value={`${product.id}-${product.nama}`} // Unique value
                                                onSelect={() => handleSelect(product)}
                                                className="flex flex-col items-start gap-1 p-3 border-b border-gray-50 last:border-0 cursor-pointer aria-selected:bg-blue-50 data-[disabled]:pointer-events-auto data-[disabled]:opacity-100"
                                            >
                                                <div className="flex w-full justify-between items-center">
                                                    <span className="text-base font-bold text-gray-900">{product.nama}</span>
                                                    <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                                                        {product.kode}
                                                    </span>
                                                </div>
                                                <div className="flex w-full justify-between text-xs text-gray-500 mt-1">
                                                    <span>Stok: <span className={cn("font-bold text-sm", product.jumlah > 10 ? "text-green-600" : "text-red-500")}>{product.jumlah}</span></span>
                                                    <span className="font-mono text-blue-600 font-bold text-sm">
                                                        Rp {product.harga.toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
