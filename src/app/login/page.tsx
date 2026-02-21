'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type LoginRole = 'admin' | 'user';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loginRole, setLoginRole] = useState<LoginRole>('admin');
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Role-based redirect
            const role = data.user?.user_metadata?.role;
            if (loginRole === 'user') {
                if (role !== 'user') {
                    await supabase.auth.signOut();
                    throw new Error('Akun ini bukan akun User. Gunakan login Admin.');
                }
                router.push('/user');
            } else {
                // admin: allow if role is 'admin' or not set (legacy)
                if (role === 'user') {
                    await supabase.auth.signOut();
                    throw new Error('Akun ini bukan akun Admin. Gunakan login User.');
                }
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-white flex items-center justify-center">
            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="z-10 w-full max-w-md px-4"
            >
                <Card className="glass border-white/20 shadow-2xl">
                    <CardHeader className="text-center space-y-2">
                        <div className="mx-auto w-32 h-32 relative mb-4 flex items-center justify-center">
                            <Image
                                src="/images/1000075381-removebg-preview.png"
                                alt="Logo Koperasi FORBIS"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                            Koperasi UMKM
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                            Masuk untuk mengakses sistem
                        </CardDescription>

                        {/* Role Toggle */}
                        <div className="flex rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 p-1 mt-2">
                            <button
                                type="button"
                                onClick={() => { setLoginRole('admin'); setError(null); }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200",
                                    loginRole === 'admin'
                                        ? "bg-white text-primary shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <ShieldCheck className="h-4 w-4" />
                                Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => { setLoginRole('user'); setError(null); }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200",
                                    loginRole === 'user'
                                        ? "bg-white text-primary shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <User className="h-4 w-4" />
                                User
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder={loginRole === 'admin' ? "admin@koperasi.id" : "user@koperasi.id"}
                                        className="pl-9"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-9"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Remember Me Checkbox */}
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="remember" className="text-sm text-gray-500 cursor-pointer">
                                    Ingat saya
                                </label>
                            </div>

                            {error && (
                                <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 shadow-lg"
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Memproses...' : `Masuk sebagai ${loginRole === 'admin' ? 'Admin' : 'User'}`}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center text-sm text-gray-400">
                        &copy; 2026 Koperasi Forbis Cimanggung
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
