const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value.trim();
        }
    });
} catch (e) {
    console.error('Gagal membaca .env.local:', e.message);
    process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL atau Key tidak ditemukan di .env.local');
    process.exit(1);
}

// 2. Connect
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Memeriksa koneksi ke Supabase...');

    // Check connection by simple query
    const { data: connectionCheck, error: connectionError } = await supabase.from('barang').select('count', { count: 'exact', head: true });

    // We expect an error if table doesn't exist, but if connection fails differently (e.g. 401) we know auth is wrong.
    // However, if table doesn't exist, error code is '42P01' (undefined_table).

    const status = {
        connected: false,
        tables: {
            barang: false,
            barang_laku: false,
            alokasi_laba: false,
            profiles: false // Optional based on schema
        }
    };

    if (connectionError && connectionError.code !== '42P01') {
        console.error('Gagal terhubung ke Supabase:', connectionError.message);
        return status;
    }

    status.connected = true;
    console.log('✅ Terhubung ke Supabase!');

    // Check specific tables
    const tablesToCheck = ['barang', 'barang_laku', 'alokasi_laba'];

    for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (!error) {
            status.tables[table] = true;
            console.log(`✅ Tabel '${table}' ditemukan.`);

            // Special check for barang_laku columns
            if (table === 'barang_laku') {
                const { data: cols, error: colError } = await supabase
                    .from('barang_laku')
                    .select('kategori')
                    .limit(1);

                if (!colError) {
                    console.log(`✅ Kolom 'kategori' di tabel 'barang_laku' ditemukan.`);
                } else if (colError.code === '42703') {
                    console.log(`❌ Kolom 'kategori' di tabel 'barang_laku' TIDAK ditemukan (Error: ${colError.message}).`);
                } else {
                    console.log(`ℹ️ Info kolom 'kategori': ${colError.message}`);
                }
            }
        } else {
            console.log(`❌ Tabel '${table}' TIDAK ditemukan (Error: ${error.message}).`);
        }
    }

    return status;
}

checkTables()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
