'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserPlus, Key, Save, User, ShieldCheck, Mail, LogOut, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { createUserAccount } from '@/lib/actions/auth';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState({
        new: false,
        confirm: false,
        admin: false,
        user: false
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        fetchUser();
    }, []);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Password konfirmasi tidak cocok!' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Password berhasil diperbarui!' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const result = await createUserAccount(email, password, 'admin');
            if (result.error) throw new Error(result.error);
            setMessage({ type: 'success', text: `Berhasil mendaftarkan admin ${email}. Akun langsung aktif tanpa verifikasi email.` });
            setEmail('');
            setPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const result = await createUserAccount(userEmail, userPassword, 'user');
            if (result.error) throw new Error(result.error);
            setMessage({ type: 'success', text: `Berhasil mendaftarkan user ${userEmail}. Akun langsung aktif, user bisa login sekarang.` });
            setUserEmail('');
            setUserPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (!currentUser) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pengaturan</h1>
                    <p className="text-gray-500">Kelola akun admin dan keamanan sistem</p>
                </div>
                <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50 gap-2">
                    <LogOut className="h-4 w-4" />
                    Keluar
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Card */}
                <Card className="shadow-sm border-gray-100 rounded-[2rem]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Profil Saya
                        </CardTitle>
                        <CardDescription>Informasi akun Anda saat ini</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50/50">
                            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                                {currentUser.email?.[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{currentUser.email}</p>
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                    Aktif
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card className="shadow-sm border-gray-100 rounded-[2rem]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-primary" />
                            Ubah Password
                        </CardTitle>
                        <CardDescription>Perbarui kata sandi akun Anda</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">Password Baru</Label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type={showPassword.new ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password"
                                        type={showPassword.confirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-gradient-primary text-white" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Simpan Perubahan
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Admin Management (Create New) */}
                <Card className="md:col-span-2 shadow-sm border-gray-100 rounded-[2rem]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            Tambah Admin Baru
                        </CardTitle>
                        <CardDescription>Daftarkan akun administrator baru untuk sistem ini</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-email">Email Admin Baru</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="new-email"
                                        type="email"
                                        className="pl-9"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin-baru@koperasi.id"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password-admin">Password Awal</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="new-password-admin"
                                        type={showPassword.admin ? "text" : "password"}
                                        className="pl-9 pr-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword({ ...showPassword, admin: !showPassword.admin })}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword.admin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-end">
                                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                                    Tambah Admin
                                </Button>
                            </div>
                        </form>

                        {message && (
                            <div className={cn(
                                "mt-6 p-4 rounded-xl text-sm font-medium",
                                message.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                            )}>
                                {message.text}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="bg-gray-50 border-t rounded-b-[2rem] p-6">
                        <div className="flex gap-4">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-white flex items-center justify-center border shadow-sm">
                                <ShieldCheck className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">Catatan Keamanan</p>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Admin baru akan didaftarkan dengan password yang Anda tentukan. Pastikan admin baru segera merubah password mereka melalui halaman ini setelah login.
                                </p>
                            </div>
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* User Management (Create New User) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="md:col-span-2 shadow-sm border-gray-100 rounded-[2rem] border-l-4 border-l-cyan-400">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-cyan-500" />
                            Tambah User Baru
                        </CardTitle>
                        <CardDescription>Daftarkan akun user untuk akses portal pembagian laba</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="user-email">Email User Baru</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="user-email"
                                        type="email"
                                        className="pl-9"
                                        value={userEmail}
                                        onChange={(e) => setUserEmail(e.target.value)}
                                        placeholder="user@koperasi.id"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="user-password-init">Password Awal</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="user-password-init"
                                        type={showPassword.user ? "text" : "password"}
                                        className="pl-9 pr-10"
                                        value={userPassword}
                                        onChange={(e) => setUserPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword({ ...showPassword, user: !showPassword.user })}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword.user ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-end">
                                <Button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                                    Tambah User
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
