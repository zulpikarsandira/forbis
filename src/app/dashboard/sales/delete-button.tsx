'use client';

import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteSale } from "@/lib/actions/sales";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteSaleButton({ id, nama, jumlah }: { id: number, nama: string, jumlah: number }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm('Yakin ingin menghapus transaksi ini? Stok barang akan dikembalikan.')) return;

        setLoading(true);
        await deleteSale(id, nama, jumlah);
        setLoading(false);
        router.refresh();
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={loading}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    );
}
