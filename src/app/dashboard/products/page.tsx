import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FileDown, FileUp, Printer } from 'lucide-react';
import ProductListTable from './product-list-table';
import { getProducts } from '@/lib/actions/products';

import { ProductForm } from '@/components/products/product-form';
import { ImportProductButton } from '@/components/products/import-product-button';
import { ExportProductButton } from '@/components/products/export-product-button';
import { PrintProductButton } from '@/components/products/print-product-button';
import { ProductSearch } from '@/components/products/product-search';

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: { q?: string; page?: string };
}) {
    // Await searchParams before accessing properties
    const params = await searchParams;
    const query = params.q || '';
    const currentPage = Number(params.page) || 1;

    const { data: products, count, totalPages } = await getProducts(query, currentPage);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Data Barang</h1>
                    <p className="text-muted-foreground">Kelola inventory, harga, dan stok barang.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <ImportProductButton />
                    <ExportProductButton />
                    <PrintProductButton />
                    <ProductForm />
                </div>
            </div>

            <ProductSearch defaultValue={query} />

            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <Suspense fallback={<div className="p-8 text-center">Loading data...</div>}>
                    <ProductListTable products={products} currentPage={currentPage} totalPages={totalPages} totalItems={count} />
                </Suspense>
            </div>
        </div>
    );
}
