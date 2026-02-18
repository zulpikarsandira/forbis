'use client';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface DashboardLineChartProps {
    labels: string[];
    values: number[];
}

export function DashboardLineChart({ labels, values }: DashboardLineChartProps) {
    const data = {
        labels,
        datasets: [
            {
                label: 'Penjualan Harian',
                data: values,
                borderColor: '#0ea5e9', // Sky 500
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#0ea5e9',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.parsed.y);
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
            },
            y: {
                border: {
                    display: false,
                },
                grid: {
                    color: '#f3f4f6',
                },
                ticks: {
                    callback: function (value: any) {
                        return new Intl.NumberFormat('id-ID', { notation: "compact", compactDisplay: "short" }).format(value);
                    }
                }
            },
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="h-full w-full min-h-[300px]">
            <Line data={data} options={options} />
        </div>
    );
}
