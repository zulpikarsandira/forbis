'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Mail, Users, ShoppingCart, TrendingUp, PieChart, Package, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Floating icons configuration
    const icons = [
        { Icon: Users, delay: 0, x: '10%', duration: 15 },
        { Icon: ShoppingCart, delay: 2, x: '80%', duration: 18 },
        { Icon: TrendingUp, delay: 4, x: '20%', duration: 20 },
        { Icon: PieChart, delay: 1, x: '70%', duration: 16 },
        { Icon: Package, delay: 3, x: '40%', duration: 19 },
        { Icon: Calendar, delay: 5, x: '90%', duration: 17 },
    ];

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gradient-primary flex items-center justify-center">
            {/* Animated Background Icons */}
            <div className="absolute inset-0 pointer-events-none">
                {icons.map(({ Icon, delay, x, duration }, i) => (
                    <motion.div
                        key={i}
                        className="absolute bottom-[-100px] text-white/10"
                        style={{ left: x }}
                        animate={{
                            y: '-120vh',
                            rotate: 360,
                        }}
                        transition={{
                            duration: duration,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: delay,
                        }}
                    >
                        <Icon size={64} />
                    </motion.div>
                ))}
            </div>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="z-10 w-full max-w-md px-4"
            >
                <Card className="glass border-white/20 shadow-2xl">
                    <CardHeader className="text-center space-y-2">
                        <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <Users className="text-primary w-8 h-8" />
                        </div>
                        <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                            Koperasi UMKM
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                            Masuk untuk mengelola inventory dan penjualan
                        </CardDescription>
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
                                        placeholder="admin@koperasi.id"
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

                            {/* Remember Me Checkbox (HTML standard for simplicity) */}
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
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Masuk'}
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
