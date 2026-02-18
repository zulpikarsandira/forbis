'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useMemo } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProfitChartProps {
    data: { category: string; amount: number }[];
}

export function ProfitChart({ data }: ProfitChartProps) {
    const chartData = useMemo(() => {
        return {
            labels: data.map(d => d.category),
            datasets: [
                {
                    label: 'Alokasi Laba',
                    data: data.map(d => d.amount),
                    backgroundColor: [
                        '#10B981', // Zakat - Green
                        '#3B82F6', // Cashback - Blue
                        '#6366F1', // Kop - Indigo
                        '#8B5CF6', // Ketua - Violet
                        '#EC4899', // Waka 1 - Pink
                        '#F43F5E', // Waka 2 - Rose
                        '#F59E0B', // Sekretaris - Amber
                        '#14B8A6', // Bendahara - Teal
                        '#64748B', // SHU - Slate
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2,
                },
            ],
        };
    }, [data]);

    const options = {
        cutout: '65%',
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                },
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.parsed);
                        }
                        return label;
                    }
                }
            }
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="h-[400px] w-full">
            <Doughnut data={chartData} options={options} />
        </div>
    );
}
