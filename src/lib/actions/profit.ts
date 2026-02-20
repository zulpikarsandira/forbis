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
export async function calculateProfit(startDate: string, endDate: string, category?: 'Warung' | 'Dapur') {
    const supabase = await createSupabaseServerClient();

    let query = supabase
        .from('barang_laku')
        .select('laba')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

    if (category) {
        query = query.eq('kategori', category);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error calculating profit:', error);
        return { error: error.message };
    }

    const totalLaba = data.reduce((sum, item) => sum + item.laba, 0);
    return { totalLaba };
}

// Generate allocation details without saving (Preview)
export async function previewAllocation(totalLaba: number) {
    // 1. Zakat 2.5% dari Total Laba
    const zakat = totalLaba * 0.025;
    const sisaZakat = totalLaba - zakat;

    // 2. Bagi Cashback Dapur (60%) & Kop. Forbis (40%) dari sisa zakat
    const cashbackDapur = sisaZakat * 0.60;
    const kopForbis = sisaZakat * 0.40;

    // 3. Bagi Kop. Forbis menjadi Operasional (80%) & SHU (20%)
    const operasional = kopForbis * 0.80;
    const shu = kopForbis * 0.20;

    // 4. Bagi Operasional untuk pekerja & DLL
    const pekerjaA = operasional * 0.275; // 27.5%
    const pekerjaB = operasional * 0.175; // 17.5%
    const pekerjaC = operasional * 0.175; // 17.5%
    const pekerjaD = operasional * 0.075; // 7.5%
    const dll = operasional * 0.30;       // 30%

    return {
        totalLaba,
        details: [
            { category: 'Zakat (2.5%)', amount: zakat },
            { category: 'Cashback Dapur (60% dari Sisa Zakat)', amount: cashbackDapur },
            { category: 'SHU (20% dari Kop. Forbis)', amount: shu },
            // Operasional breakdown
            { category: 'Pekerja A (27.5% dari Operasional)', amount: pekerjaA },
            { category: 'Pekerja B (17.5% dari Operasional)', amount: pekerjaB },
            { category: 'Pekerja C (17.5% dari Operasional)', amount: pekerjaC },
            { category: 'Pekerja D (7.5% dari Operasional)', amount: pekerjaD },
            { category: 'DLL (30% dari Operasional)', amount: dll },
        ]
    };
}

export async function generateAndLockAllocation(startDate: string, endDate: string, periodeName: string, category?: 'Warung' | 'Dapur') {
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
    const { totalLaba, error } = await calculateProfit(startDate, endDate, category);
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

export type DetailedProfitItem = {
    id: number;
    tanggal: string;
    no_faktur: string;
    nama_barang: string;
    banyak: number;
    satuan: string;
    harga_suplier: number; // Modal
    jumlah_modal: number; // Total Modal
    harga_koperasi: number; // Jual
    jumlah_jual: number; // Total Jual
    laba: number; // Profit
    zakat: number;
    sisa: number;
    cashback_dapur: number;
    kop_forbis: number;
    operasional: number;
    shu: number;
    pekerja_a: number;
    pekerja_b: number;
    pekerja_c: number;
    pekerja_d: number;
    dll: number;
}

export async function getDetailedProfitData(startDate: string, endDate: string, category?: 'Warung' | 'Dapur') {
    const supabase = await createSupabaseServerClient();

    // 1. Fetch Sales
    let query = supabase
        .from('barang_laku')
        .select('*')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
        .order('tanggal', { ascending: true });

    if (category) {
        query = query.eq('kategori', category);
    }

    const { data: sales, error: salesError } = await query;

    if (salesError) return { error: salesError.message };

    // 2. Fetch Products
    const productNames = [...new Set(sales.map((s: any) => s.nama))];
    const { data: products } = await supabase
        .from('barang')
        .select('nama, suplier')
        .in('nama', productNames);

    // Create map for quick lookup
    const productMap = new Map(products?.map((p: any) => [p.nama, p]) || []);

    const detailedData: DetailedProfitItem[] = sales.map((sale: any) => {
        const product = productMap.get(sale.nama);

        // Basic calculations
        const totalJual = sale.total_harga;
        const profit = sale.laba;
        const totalModal = totalJual - profit;

        const qty = sale.jumlah;
        const hargaSuplier = qty > 0 ? totalModal / qty : 0;
        const hargaKoperasi = qty > 0 ? totalJual / qty : 0;

        // Allocation Logic (Per Row)
        const zakat = profit * 0.025;
        const sisaZakat = profit - zakat;
        const cashbackDapur = sisaZakat * 0.60;
        const kopForbis = sisaZakat * 0.40;

        const operasional = kopForbis * 0.80;
        const shu = kopForbis * 0.20;

        const pekerjaA = operasional * 0.275; // 27.5%
        const pekerjaB = operasional * 0.175; // 17.5%
        const pekerjaC = operasional * 0.175; // 17.5%
        const pekerjaD = operasional * 0.075; // 7.5%
        const dll = operasional * 0.30;       // 30%

        return {
            id: sale.id,
            tanggal: sale.tanggal,
            no_faktur: `INV/${new Date(sale.tanggal).getTime()}/${sale.id}`, // Generated Invoice ID
            nama_barang: sale.nama,
            banyak: qty,
            satuan: 'Pcs', // Default
            harga_suplier: hargaSuplier,
            jumlah_modal: totalModal,
            harga_koperasi: hargaKoperasi,
            jumlah_jual: totalJual,
            laba: profit,
            zakat,
            sisa: sisaZakat,
            cashback_dapur: cashbackDapur,
            kop_forbis: kopForbis,
            operasional,
            shu,
            pekerja_a: pekerjaA,
            pekerja_b: pekerjaB,
            pekerja_c: pekerjaC,
            pekerja_d: pekerjaD,
            dll
        };
    });

    return { data: detailedData };
}

