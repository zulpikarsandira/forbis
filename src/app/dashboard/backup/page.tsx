'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAllDataForBackup, restoreData } from '@/lib/actions/backup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download, Upload, Database, Clock, CheckCircle2, AlertTriangle, Loader2, RotateCcw, Shield } from 'lucide-react';
import JSZip from 'jszip';

const STORAGE_KEY = 'forbis_backup_schedule';

type BackupSchedule = {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    hour: string;
    lastBackup: string | null;
    nextBackup: string | null;
};

const defaultSchedule: BackupSchedule = {
    enabled: false,
    frequency: 'daily',
    hour: '08',
    lastBackup: null,
    nextBackup: null,
};

function calcNextBackup(frequency: string, hour: string): string {
    const now = new Date();
    const next = new Date();
    next.setHours(parseInt(hour), 0, 0, 0);

    if (frequency === 'daily') {
        if (next <= now) next.setDate(next.getDate() + 1);
    } else if (frequency === 'weekly') {
        next.setDate(next.getDate() + (7 - next.getDay()));
    } else if (frequency === 'monthly') {
        next.setMonth(next.getMonth() + 1, 1);
    }
    return next.toISOString();
}

export default function BackupPage() {
    const [downloading, setDownloading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [restorePreview, setRestorePreview] = useState<{ barang: number; barang_laku: number; alokasi_laba: number } | null>(null);
    const [restorePayload, setRestorePayload] = useState<any>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [schedule, setSchedule] = useState<BackupSchedule>(defaultSchedule);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [lastAutoBackup, setLastAutoBackup] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load schedule from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setSchedule(JSON.parse(saved));
    }, []);

    const saveSchedule = (updated: BackupSchedule) => {
        setSchedule(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    // ── Backup logic ──────────────────────────────────────────────
    const runBackup = useCallback(async (auto = false) => {
        if (!auto) setDownloading(true);
        try {
            const result = await getAllDataForBackup();
            if (result.error) { setStatus({ type: 'error', msg: result.error }); return; }

            const zip = new JSZip();
            const d = result.data!;
            zip.file('barang.json', JSON.stringify(d.barang, null, 2));
            zip.file('barang_laku.json', JSON.stringify(d.barang_laku, null, 2));
            zip.file('alokasi_laba.json', JSON.stringify(d.alokasi_laba, null, 2));
            zip.file('backup_info.json', JSON.stringify(d.backup_info, null, 2));

            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `forbis_backup_${new Date().toISOString().split('T')[0]}.zip`;
            a.click();
            URL.revokeObjectURL(url);

            const now = new Date().toLocaleString('id-ID');
            setLastAutoBackup(now);
            setStatus({ type: 'success', msg: auto ? `Auto backup berhasil: ${now}` : 'Backup berhasil didownload!' });

            // Update next backup time
            if (auto) {
                const updated = { ...schedule, lastBackup: new Date().toISOString(), nextBackup: calcNextBackup(schedule.frequency, schedule.hour) };
                saveSchedule(updated);
            }
        } catch {
            setStatus({ type: 'error', msg: 'Gagal membuat file backup.' });
        } finally {
            if (!auto) setDownloading(false);
        }
    }, [schedule]);

    // ── Auto backup interval ──────────────────────────────────────
    useEffect(() => {
        if (!schedule.enabled) return;
        const interval = setInterval(() => {
            if (!schedule.nextBackup) return;
            const now = new Date();
            const next = new Date(schedule.nextBackup);
            if (now >= next) runBackup(true);
        }, 60 * 1000);
        return () => clearInterval(interval);
    }, [schedule, runBackup]);

    // ── Restore logic ─────────────────────────────────────────────
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const zip = new JSZip();
            const loaded = await zip.loadAsync(file);
            const barang = JSON.parse(await (loaded.file('barang.json')?.async('string') ?? Promise.resolve('[]')));
            const barang_laku = JSON.parse(await (loaded.file('barang_laku.json')?.async('string') ?? Promise.resolve('[]')));
            const alokasi_laba = JSON.parse(await (loaded.file('alokasi_laba.json')?.async('string') ?? Promise.resolve('[]')));
            setRestorePreview({ barang: barang.length, barang_laku: barang_laku.length, alokasi_laba: alokasi_laba.length });
            setRestorePayload({ barang, barang_laku, alokasi_laba });
        } catch {
            setStatus({ type: 'error', msg: 'File tidak valid atau corrupt.' });
        }
        e.target.value = '';
    };

    const handleRestore = async () => {
        setShowConfirm(false);
        setRestoring(true);
        const result = await restoreData(restorePayload);
        if (result.error) {
            setStatus({ type: 'error', msg: result.error });
        } else {
            setStatus({ type: 'success', msg: 'Data berhasil di-restore!' });
            setRestorePreview(null);
            setRestorePayload(null);
        }
        setRestoring(false);
    };

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                    <Shield className="h-8 w-8 text-primary" />
                    Backup & Restore
                </h1>
                <p className="text-muted-foreground mt-1">Kelola backup data database Forbis Cimanggung.</p>
            </div>

            {/* Status Banner */}
            {status && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {status.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                    {status.msg}
                    <button onClick={() => setStatus(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Section 1: Manual Backup */}
            <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Download className="h-5 w-5 text-blue-600" />
                        Backup Manual
                    </CardTitle>
                    <CardDescription>Download seluruh data database sebagai file ZIP.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                        {[
                            { label: 'Data Barang', icon: '📦' },
                            { label: 'Entry Penjualan', icon: '🧾' },
                            { label: 'Alokasi Laba', icon: '💰' },
                        ].map(({ label, icon }) => (
                            <div key={label} className="rounded-xl bg-gray-50 border p-3">
                                <div className="text-2xl mb-1">{icon}</div>
                                <div className="text-xs text-gray-600 font-medium">{label}</div>
                            </div>
                        ))}
                    </div>
                    <Button onClick={() => runBackup(false)} disabled={downloading} className="w-full gap-2 rounded-xl">
                        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {downloading ? 'Memproses...' : 'Download Backup Sekarang'}
                    </Button>
                </CardContent>
            </Card>

            {/* Section 2: Auto Backup */}
            <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-purple-600" />
                        Backup Otomatis
                    </CardTitle>
                    <CardDescription>Jadwalkan backup otomatis. Aktif selama browser dibuka.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border">
                        <div>
                            <Label className="font-semibold text-sm">Aktifkan Auto Backup</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">Backup berjalan otomatis sesuai jadwal</p>
                        </div>
                        <Switch
                            checked={schedule.enabled}
                            onCheckedChange={(v) => {
                                const updated = { ...schedule, enabled: v, nextBackup: v ? calcNextBackup(schedule.frequency, schedule.hour) : null };
                                saveSchedule(updated);
                            }}
                        />
                    </div>

                    {/* Schedule Settings */}
                    <div className={`space-y-4 transition-opacity ${schedule.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Frekuensi</Label>
                                <Select
                                    value={schedule.frequency}
                                    onValueChange={(v: any) => {
                                        const updated = { ...schedule, frequency: v, nextBackup: calcNextBackup(v, schedule.hour) };
                                        saveSchedule(updated);
                                    }}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Setiap Hari</SelectItem>
                                        <SelectItem value="weekly">Setiap Minggu</SelectItem>
                                        <SelectItem value="monthly">Setiap Bulan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Jam Backup</Label>
                                <Select
                                    value={schedule.hour}
                                    onValueChange={(v) => {
                                        const updated = { ...schedule, hour: v, nextBackup: calcNextBackup(schedule.frequency, v) };
                                        saveSchedule(updated);
                                    }}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                                            <SelectItem key={h} value={h}>{h}:00</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {schedule.enabled && schedule.nextBackup && (
                            <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                ⏰ <strong>Backup berikutnya:</strong>{' '}
                                {new Date(schedule.nextBackup).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                                {lastAutoBackup && <><br />✅ <strong>Terakhir:</strong> {lastAutoBackup}</>}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Section 3: Restore */}
            <Card className="rounded-2xl border-0 shadow-sm border-orange-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <RotateCcw className="h-5 w-5 text-orange-500" />
                        Restore Data
                    </CardTitle>
                    <CardDescription>Upload file ZIP backup untuk mengembalikan data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleFileUpload} />

                    {!restorePreview ? (
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full gap-2 rounded-xl border-dashed border-2 h-20 text-muted-foreground hover:text-primary hover:border-primary">
                            <Upload className="h-5 w-5" />
                            Klik untuk upload file .zip backup
                        </Button>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-xl bg-orange-50 border border-orange-200 p-4">
                                <p className="text-sm font-semibold text-orange-700 mb-3">📋 Preview File Backup:</p>
                                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                                    {[
                                        { label: 'Data Barang', count: restorePreview.barang, icon: '📦' },
                                        { label: 'Entry Penjualan', count: restorePreview.barang_laku, icon: '🧾' },
                                        { label: 'Alokasi Laba', count: restorePreview.alokasi_laba, icon: '💰' },
                                    ].map(({ label, count, icon }) => (
                                        <div key={label} className="rounded-lg bg-white p-2 border">
                                            <div className="text-xl">{icon}</div>
                                            <div className="font-bold text-lg">{count}</div>
                                            <div className="text-xs text-gray-500">{label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => { setRestorePreview(null); setRestorePayload(null); }} className="flex-1 rounded-xl">
                                    Batal
                                </Button>
                                <Button onClick={() => setShowConfirm(true)} disabled={restoring} className="flex-1 gap-2 rounded-xl bg-orange-500 hover:bg-orange-600">
                                    {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                    Konfirmasi Restore
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Confirm Dialog */}
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>⚠️ Konfirmasi Restore Data</AlertDialogTitle>
                        <AlertDialogDescription>
                            Data yang ada di database akan <strong>digabung/ditimpa</strong> dengan data dari file backup.
                            Tindakan ini tidak bisa dibatalkan. Pastikan Anda sudah membackup data terbaru sebelum melanjutkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestore} className="bg-orange-500 hover:bg-orange-600">
                            Ya, Restore Sekarang
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
