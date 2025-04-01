import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface BandwidthDataPoint {
    timestamp: string;
    download: number;
    upload: number;
}

interface BandwidthUsageGraphProps {
    bandwidthHistory: BandwidthDataPoint[];
    timeRange: '5min' | '1hour' | '1day';
}

const BandwidthUsageGraph: React.FC<BandwidthUsageGraphProps> = ({
    bandwidthHistory,
    timeRange
}) => {
    // Format the timestamps based on selected time range
    const formatLabel = (timestamp: string) => {
        const date = new Date(timestamp);
        if (timeRange === '5min') {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } else if (timeRange === '1hour') {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };

    // Set a minimum range for the y-axis to ensure values are visible
    const getYAxisMax = () => {
        const maxDownload = Math.max(...bandwidthHistory.map(item => item.download));
        const maxUpload = Math.max(...bandwidthHistory.map(item => item.upload));
        const maxValue = Math.max(maxDownload, maxUpload);

        // If all values are 0 or very small, return a default maximum
        if (maxValue < 1) {
            return 1;
        }

        // Otherwise, return the maximum value plus some padding
        return Math.ceil(maxValue * 1.2);
    };

    // Generate sample data if history is empty (for development/testing)
    const ensureData = (history: BandwidthDataPoint[]) => {
        if (history.length === 0) {
            // Create sample data for development/testing
            const now = new Date();
            const sampleData = [];
            for (let i = 0; i < 10; i++) {
                const time = new Date(now.getTime() - (9 - i) * 30000); // 30 seconds intervals
                sampleData.push({
                    timestamp: time.toISOString(),
                    download: Math.random() * 5, // Random value between 0 and 5
                    upload: Math.random() * 2  // Random value between 0 and 2
                });
            }
            return sampleData;
        }
        return history;
    };

    // Use the actual data or sample data if empty
    const dataToUse = bandwidthHistory.length > 0 ? bandwidthHistory : ensureData([]);

    const data = {
        labels: dataToUse.map(item => formatLabel(item.timestamp)),
        datasets: [
            {
                label: 'Download (Mbps)',
                data: dataToUse.map(item => item.download),
                borderColor: '#00FF00',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                tension: 0.3,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 5,
            },
            {
                label: 'Upload (Mbps)',
                data: dataToUse.map(item => item.upload),
                borderColor: '#33CCFF',
                backgroundColor: 'rgba(51, 204, 255, 0.1)',
                tension: 0.3,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 5,
            },
        ],
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#CCCCCC',
                    font: {
                        size: 12
                    }
                }
            },
            title: {
                display: false,
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#FFFFFF',
                bodyColor: '#CCCCCC',
                borderColor: '#333333',
                borderWidth: 1,
            },
        },
        scales: {
            x: {
                ticks: {
                    color: '#CCCCCC',
                    maxRotation: 0,
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
            },
            y: {
                beginAtZero: true,
                max: getYAxisMax(),
                ticks: {
                    color: '#CCCCCC',
                    precision: 1,
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                title: {
                    display: true,
                    text: 'Speed (Mbps)',
                    color: '#CCCCCC',
                },
            },
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        },
        animation: {
            duration: 500
        }
    };

    return (
        <div style={{ height: '300px', position: 'relative' }}>
            <Line data={data} options={options} />
        </div>
    );
};

export default BandwidthUsageGraph; 