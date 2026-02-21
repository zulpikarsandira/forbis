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
                    // Server actions mutation
                },
                remove(name: string, options: CookieOptions) {
                    // Server actions mutation
                },
            },
        }
    )
}

export type Sale = {
    id: number;
    tanggal: string;
    nama: string;
    total_harga: number;
    jumlah: number;
    laba: number;
    kategori: 'Dapur' | 'Warung';
    created_at: string;
    is_deleted?: boolean;
};

export async function getSales(dateFrom?: string, dateTo?: string) {
    const supabase = await createSupabaseServerClient();

    let query = supabase
        .from('barang_laku')
        .select('*')
        .order('id', { ascending: false });

    if (dateFrom) {
        query = query.gte('tanggal', dateFrom);
    }
    if (dateTo) {
        query = query.lte('tanggal', dateTo);
    }

    // Default to this month if no filter
    if (!dateFrom && !dateTo) {
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        query = query.gte('tanggal', firstDay);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching sales:', error);
        return { data: [], error: error.message };
    }

    return { data: data as Sale[] };
}

// Get sales for TODAY only
export async function getTodaySales() {
    const supabase = await createSupabaseServerClient();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

    const { data, error } = await supabase
        .from('barang_laku')
        .select('*')
        .eq('tanggal', today)
        .order('id', { ascending: false });

    if (error) return { data: [], error: error.message, today };
    // Filter out soft-deleted rows in app code (is_deleted may be undefined for old rows)
    const active = (data as Sale[]).filter(s => !s.is_deleted);
    return { data: active, today };
}

// Get list of unique dates that have sales data (excluding today)
export async function getHistoryDates() {
    const supabase = await createSupabaseServerClient();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

    // Fetch all records (including today) to compute full picture
    const { data, error } = await supabase
        .from('barang_laku')
        .select('tanggal, is_deleted')
        .order('tanggal', { ascending: true });

    if (error) return { dates: [], firstDate: null, todayHasData: false };

    // Filter out soft-deleted rows
    const active = data.filter(d => !d.is_deleted);

    // Past dates with data (exclude today)
    const pastActive = active.filter(d => d.tanggal !== today);
    const uniqueDates = [...new Set(pastActive.map(d => d.tanggal))] as string[];

    // Oldest date ever recorded (for determining the red-mark range)
    const firstDate = active.length > 0 ? active[0].tanggal : null;

    // Whether today already has any active entry
    const todayHasData = active.some(d => d.tanggal === today);

    return { dates: uniqueDates, firstDate, todayHasData };
}

// Get sales for a specific date (for history view)
export async function getSalesByDate(date: string, onlyDeleted = false) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from('barang_laku')
        .select('*')
        .eq('tanggal', date)
        .order('id', { ascending: false });

    if (error) return { data: [], error: error.message };
    // Filter in app code: is_deleted undefined (old rows) treated as false = not deleted
    const filtered = (data as Sale[]).filter(s =>
        onlyDeleted ? s.is_deleted === true : !s.is_deleted
    );
    return { data: filtered };
}

export async function createSale(formData: FormData) {
    const supabase = await createSupabaseServerClient();

    const kode = formData.get('kode') as string; // We used name in combobox, but let's use product object
    const nama = formData.get('nama') as string;
    const jumlah = Number(formData.get('jumlah'));
    const hargaJual = Number(formData.get('harga_jual'));
    const tanggal = formData.get('tanggal') as string;
    const modal = Number(formData.get('modal_per_item'));
    const kategori = (formData.get('kategori') as string) || 'Warung';

    if (!nama || jumlah <= 0) {
        return { error: 'Data tidak valid!' };
    }

    // 1. Check current stock first (Concurrency check ideal but simple check here)
    const { data: product, error: productError } = await supabase
        .from('barang')
        .select('jumlah, modal')
        .eq('nama', nama) // Using name as key based on schema default
        .single();

    if (productError || !product) {
        return { error: 'Barang tidak ditemukan!' };
    }

    if (product.jumlah < jumlah) {
        return { error: `Stok tidak cukup! Sisa: ${product.jumlah}` };
    }

    // 2. Calculate values
    const totalHarga = hargaJual * jumlah;
    const laba = (hargaJual - modal) * jumlah;

    // 3. Perform Transaction (Supabase doesn't support easy transactions via JS client without RPC, 
    // so we do best effort sequence: Update Stock -> Insert Sale. 
    // Ideally we assume success or handle manual rollback if insert fails).

    // Decrease Stock and Update Modal (Purchase Price)
    const { error: updateError } = await supabase
        .from('barang')
        .update({
            jumlah: product.jumlah - jumlah,
            modal: modal
        })
        .eq('nama', nama);

    if (updateError) {
        return { error: 'Gagal update stok: ' + updateError.message };
    }

    // Insert Sale
    const { error: insertError } = await supabase
        .from('barang_laku')
        .insert({
            tanggal,
            nama,
            total_harga: totalHarga,
            jumlah,
            laba,
            kategori
        });

    if (insertError) {
        // Critical: Rollback stock (Manual)
        await supabase.from('barang').update({ jumlah: product.jumlah }).eq('nama', nama);
        return { error: 'Gagal menyimpan transaksi: ' + insertError.message };
    }

    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard'); // Update charts

    return { success: true };
}

export async function deleteSale(id: number, nama: string, jumlah: number) {
    const supabase = await createSupabaseServerClient();

    // 1. Get current product to restore stock
    const { data: product } = await supabase.from('barang').select('jumlah').eq('nama', nama).single();

    // Restore Stock
    if (product) {
        await supabase.from('barang').update({ jumlah: product.jumlah + jumlah }).eq('nama', nama);
    }

    // Delete Transaction
    const { error } = await supabase.from('barang_laku').delete().eq('id', id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/products');
    return { success: true };
}

// soft delete a history record
export async function softDeleteHistorySale(id: number) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('barang_laku').update({ is_deleted: true }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/dashboard/sales');
    return { success: true };
}

// Restore a previously deleted history record
export async function restoreHistorySale(id: number) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('barang_laku').update({ is_deleted: false }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/dashboard/sales');
    return { success: true };
}

// Hard delete a history record
export async function hardDeleteHistorySale(id: number) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('barang_laku').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/dashboard/sales');
    return { success: true };
}

