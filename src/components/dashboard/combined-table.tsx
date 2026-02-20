'use client';

import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Briefcase, ShoppingCart, History, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DashboardCombinedTableProps {
    lowStockItems: any[];
    recentSales: any[];
}

export function DashboardCombinedTable({ lowStockItems, recentSales }: DashboardCombinedTableProps) {
    const [activeTab, setActiveTab] = useState<'low-stock' | 'recent-activity'>('low-stock');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="font-bold text-lg text-gray-900">Stok Menipis & Aktivitas Terakhir</h3>
                <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('low-stock')}
                        className={cn(
                            "flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === 'low-stock'
                                ? "bg-white text-primary shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <AlertTriangle className="h-4 w-4" />
                        <span className="whitespace-nowrap">Stok Menipis</span>
                        {lowStockItems.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
                                {lowStockItems.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('recent-activity')}
                        className={cn(
                            "flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === 'recent-activity'
                                ? "bg-white text-primary shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <History className="h-4 w-4" />
                        <span className="whitespace-nowrap">Aktivitas</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-8 py-6 whitespace-nowrap">{activeTab === 'low-stock' ? 'Nama Barang' : 'Transaksi'}</th>
                                <th className="px-6 py-6 whitespace-nowrap">{activeTab === 'low-stock' ? 'Status' : 'Jumlah & Kategori'}</th>
                                <th className="px-6 py-6 whitespace-nowrap">{activeTab === 'low-stock' ? 'Stok' : 'Waktu'}</th>
                                <th className="px-6 py-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {activeTab === 'low-stock' ? (
                                lowStockItems.length > 0 ? (
                                    lowStockItems.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                                                        <Briefcase className="h-5 w-5" />
                                                    </div>
                                                    <span className="font-bold text-gray-900">{product.nama}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <Badge variant="outline" className={`${product.jumlah === 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'} rounded-lg px-3 py-1`}>
                                                    {product.jumlah === 0 ? 'Habis' : 'Stok Menipis'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5 text-gray-900 font-bold whitespace-nowrap">{product.jumlah} pcs</td>
                                            <td className="px-6 py-5 text-right">
                                                <Link href="/dashboard/products" className="text-gray-400 hover:text-indigo-600 font-medium text-sm whitespace-nowrap">
                                                    Update Stok
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-10 text-center text-muted-foreground">
                                            Seluruh stok barang aman.
                                        </td>
                                    </tr>
                                )
                            ) : (
                                recentSales.length > 0 ? (
                                    recentSales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-primary">
                                                        <ShoppingCart className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 whitespace-nowrap">{sale.nama}</span>
                                                        <span className="text-xs text-gray-500">#{sale.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{sale.jumlah} items</span>
                                                    <span className="text-xs text-gray-500">{sale.kategori}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-gray-900 font-medium text-sm whitespace-nowrap">
                                                {new Date(sale.created_at || sale.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <Link href="/dashboard/sales" className="text-gray-400 hover:text-indigo-600 font-medium text-sm whitespace-nowrap">
                                                    Lihat Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-10 text-center text-muted-foreground">
                                            Belum ada transaksi hari ini.
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
