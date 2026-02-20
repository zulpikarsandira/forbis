'use client';

import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface DashboardBarChartProps {
    labels: string[];
    values: number[];
}

export function DashboardBarChart({ labels, values }: DashboardBarChartProps) {
    const data = {
        labels: labels.map(l => {
            const date = new Date(l);
            return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        }),
        datasets: [
            {
                label: 'Penjualan',
                data: values,
                backgroundColor: '#4F46E5', // Indigo
                borderRadius: 8,
                barThickness: 24,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'end' as const,
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    font: {
                        family: 'Inter',
                        size: 11
                    },
                    color: '#9CA3AF'
                }
            },
            title: {
                display: false,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    font: { family: 'Inter' },
                    color: '#9CA3AF'
                }
            },
            y: {
                grid: { display: false }, // Hide grid lines
                border: { display: false },
                ticks: {
                    display: true,
                    font: { family: 'Inter' },
                    color: '#9CA3AF',
                    stepSize: 20
                }
            }
        }
    };

    return <Bar options={options} data={data} />;
}
