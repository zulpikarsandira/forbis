'use server';

import { createClient } from "@/lib/supabase/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from '@supabase/ssr'

async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (error) {
                        // The `set` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch (error) {
                        // The `delete` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

export type Product = {
    id: number;
    kode: string;
    nama: string;
    jenis: string | null;
    suplier: string | null;
    modal: number;
    harga: number;
    jumlah: number;
    created_at: string;
    updated_at: string;
};

export async function getProducts(search?: string, page: number = 1, limit: number = 10) {
    const supabase = await createSupabaseServerClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('barang')
        .select('*', { count: 'exact' })
        .order('id', { ascending: false })
        .range(from, to);

    if (search) {
        query = query.or(`nama.ilike.%${search}%,kode.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching products:', error);
        throw new Error('Failed to fetch products');
    }

    return {
        data: data as Product[],
        count: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0,
    };
}

export async function createProduct(formData: FormData) {
    const supabase = await createSupabaseServerClient();

    const rawData = {
        kode: formData.get('kode') as string,
        nama: formData.get('nama') as string,
        jenis: formData.get('jenis') as string,
        suplier: formData.get('suplier') as string,
        modal: Number(formData.get('modal')),
        harga: Number(formData.get('harga')),
        jumlah: Number(formData.get('jumlah')),
    };

    // Validation
    if (rawData.harga < rawData.modal) {
        return { error: 'Harga jual tidak boleh lebih kecil dari harga modal!' };
    }

    const { error } = await supabase.from('barang').insert(rawData);

    if (error) {
        if (error.code === '23505') { // Unique violation for 'kode'
            return { error: 'Kode barang sudah ada!' };
        }
        return { error: error.message };
    }

    revalidatePath('/dashboard/products');
    return { success: true };
}

export async function updateProduct(id: number, formData: FormData) {
    const supabase = await createSupabaseServerClient();

    const rawData = {
        kode: formData.get('kode') as string,
        nama: formData.get('nama') as string,
        jenis: formData.get('jenis') as string,
        suplier: formData.get('suplier') as string,
        modal: Number(formData.get('modal')),
        harga: Number(formData.get('harga')),
        jumlah: Number(formData.get('jumlah')),
    };

    // Validation
    if (rawData.harga < rawData.modal) {
        return { error: 'Harga jual tidak boleh lebih kecil dari harga modal!' };
    }

    const { error } = await supabase.from('barang').update(rawData).eq('id', id);

    if (error) {
        if (error.code === '23505') {
            return { error: 'Kode barang sudah ada!' };
        }
        return { error: error.message };
    }

    revalidatePath('/dashboard/products');
    return { success: true };
}

export async function deleteProduct(id: number) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('barang').delete().eq('id', id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/dashboard/products');
    return { success: true };
}

export async function bulkCreateProducts(products: Omit<Product, 'id' | 'created_at' | 'updated_at'>[]) {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from('barang').insert(products);

    if (error) {
        if (error.code === '23505') {
            return { error: 'Salah satu kode barang sudah ada di sistem!' };
        }
        return { error: error.message };
    }

    revalidatePath('/dashboard/products');
    return { success: true };
}

export async function getAllProducts() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('barang')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching all products:', error);
        throw new Error('Failed to fetch products for export');
    }

    return data as Product[];
}
