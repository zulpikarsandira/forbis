'use server';

import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.');
    }

    return createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

export async function createUserAccount(
    email: string,
    password: string,
    role: 'admin' | 'user'
): Promise<{ success?: boolean; error?: string }> {
    try {
        const supabase = createAdminClient();

        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // langsung confirmed, tidak perlu verifikasi email
            user_metadata: { role },
        });

        if (error) return { error: error.message };
        if (!data.user) return { error: 'Gagal membuat akun.' };

        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}
