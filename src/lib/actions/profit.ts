'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

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
                },
                remove(name: string, options: CookieOptions) {
                },
            },
        }
    )
}

export type ProfitAllocation = {
    id: number;
    tanggal: string;
    keterangan: string;
    jumlah: number;
    periode: string;
    generated_by: string;
    generated_at: string;
    is_locked: boolean;
};

// Calculate potential profit for a period
export async function calculateProfit(startDate: string, endDate: string) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from('barang_laku')
        .select('laba')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

    if (error) {
        console.error('Error calculating profit:', error);
        return { error: error.message };
    }

    const totalLaba = data.reduce((sum, item) => sum + item.laba, 0);
    return { totalLaba };
}

// Generate allocation details without saving (Preview)
export async function previewAllocation(totalLaba: number) {
    const zakat = totalLaba * 0.025;
    const sisa = totalLaba - zakat;
    const cashback = sisa * 0.60;
    const kop = sisa * 0.40;

    // Breakdown Kop
    const ketua = kop * 0.40;
    const waka1 = kop * 0.10;
    const waka2 = kop * 0.10;
    const sekretaris = kop * 0.10;
    const bendahara = kop * 0.25;
    const shu = kop * 0.05;

    return {
        totalLaba,
        zakat,
        cashback,
        kop,
        details: [
            { category: 'Zakat (2.5%)', amount: zakat },
            { category: 'Cashback (60%)', amount: cashback },
            { category: 'Kop. Forbis (40%)', amount: kop },
            // Breakdown
            { category: 'Ketua (40% dari Kop)', amount: ketua },
            { category: 'Wakil Ketua 1 (10% dari Kop)', amount: waka1 },
            { category: 'Wakil Ketua 2 (10% dari Kop)', amount: waka2 },
            { category: 'Sekretaris (10% dari Kop)', amount: sekretaris },
            { category: 'Bendahara (25% dari Kop)', amount: bendahara },
            { category: 'SHU (5% dari Kop)', amount: shu },
        ]
    };
}

export async function generateAndLockAllocation(startDate: string, endDate: string, periodeName: string) {
    const supabase = await createSupabaseServerClient();

    // 1. Check if locked
    const { data: existing } = await supabase
        .from('alokasi_laba')
        .select('id')
        .eq('periode', periodeName)
        .eq('is_locked', true)
        .limit(1);

    if (existing && existing.length > 0) {
        return { error: 'Periode ini sudah digenerate dan dikunci!' };
    }

    // 2. Calculate Profit
    const { totalLaba, error } = await calculateProfit(startDate, endDate);
    if (error || typeof totalLaba !== 'number') return { error: 'Gagal menghitung laba.' };

    if (totalLaba <= 0) return { error: 'Tidak ada laba untuk periode ini.' };

    // 3. Calculate Allocation
    const allocation = await previewAllocation(totalLaba);

    // 4. Save to Database
    const userUser = (await supabase.auth.getUser()).data.user;
    const userName = userUser?.email || 'Admin'; // Fallback

    const rowsToInsert = allocation.details.map(item => ({
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: item.category,
        jumlah: item.amount,
        periode: periodeName,
        generated_by: userName,
        generated_at: new Date().toISOString(),
        is_locked: true
    }));

    const { error: insertError } = await supabase.from('alokasi_laba').insert(rowsToInsert);

    if (insertError) {
        return { error: insertError.message };
    }

    revalidatePath('/dashboard/profit');
    return { success: true };
}

export async function getProfitAllocation(periode: string) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from('alokasi_laba')
        .select('*')
        .eq('periode', periode);

    if (error) return { data: [], error: error.message };

    return { data: data as ProfitAllocation[] };
}

export async function resetAllocation(periode: string) {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from('alokasi_laba')
        .delete()
        .eq('periode', periode);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/profit');
    return { success: true };
}
