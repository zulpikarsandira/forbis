'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function createSupabaseServerClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(_name: string, _value: string, _options: CookieOptions) { },
                remove(_name: string, _options: CookieOptions) { },
            },
        }
    );
}

export async function getAllDataForBackup() {
    const supabase = await createSupabaseServerClient();

    const [barang, barangLaku, alokasiLaba] = await Promise.all([
        supabase.from('barang').select('*').order('id'),
        supabase.from('barang_laku').select('*').order('id'),
        supabase.from('alokasi_laba').select('*').order('id'),
    ]);

    if (barang.error || barangLaku.error || alokasiLaba.error) {
        return { error: 'Gagal mengambil data untuk backup.' };
    }

    return {
        data: {
            barang: barang.data || [],
            barang_laku: barangLaku.data || [],
            alokasi_laba: alokasiLaba.data || [],
            backup_info: {
                created_at: new Date().toISOString(),
                version: '1.0',
                app: 'Forbis Cimanggung',
            },
        },
    };
}

export async function restoreData(payload: {
    barang?: any[];
    barang_laku?: any[];
    alokasi_laba?: any[];
}) {
    const supabase = await createSupabaseServerClient();
    const errors: string[] = [];

    // Restore barang (products)
    if (payload.barang && payload.barang.length > 0) {
        const { error } = await supabase
            .from('barang')
            .upsert(payload.barang, { onConflict: 'id' });
        if (error) errors.push(`Barang: ${error.message}`);
    }

    // Restore barang_laku (sales)
    if (payload.barang_laku && payload.barang_laku.length > 0) {
        const { error } = await supabase
            .from('barang_laku')
            .upsert(payload.barang_laku, { onConflict: 'id' });
        if (error) errors.push(`Barang Laku: ${error.message}`);
    }

    // Restore alokasi_laba (profit allocation)
    if (payload.alokasi_laba && payload.alokasi_laba.length > 0) {
        const { error } = await supabase
            .from('alokasi_laba')
            .upsert(payload.alokasi_laba, { onConflict: 'id' });
        if (error) errors.push(`Alokasi Laba: ${error.message}`);
    }

    if (errors.length > 0) {
        return { error: errors.join('; ') };
    }

    return { success: true };
}
