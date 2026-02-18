'use client';

import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition, useEffect, useState } from 'react';

export function ProductSearch({ defaultValue }: { defaultValue: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState(defaultValue);

    // Initial value update if defaultValue changes (e.g. browser back button)
    useEffect(() => {
        setSearchTerm(defaultValue);
    }, [defaultValue]);

    const handleSearch = (term: string) => {
        setSearchTerm(term);

        startTransition(() => {
            const params = new URLSearchParams(searchParams);
            if (term) {
                params.set('q', term);
            } else {
                params.delete('q');
            }
            // Reset to page 1 on search
            params.set('page', '1');
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div className="flex items-center space-x-2 bg-white p-4 rounded-xl shadow-sm border">
            {isPending ? (
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            ) : (
                <Search className="h-5 w-5 text-gray-400" />
            )}
            <Input
                placeholder="Cari nama barang atau kode..."
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 pl-0 text-base"
                type="search"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
            />
        </div>
    );
}
