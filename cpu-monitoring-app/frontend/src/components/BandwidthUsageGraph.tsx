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
    isSpeedTest?: boolean;
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
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        if (timeRange === '1day') {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
                    upload: Math.random() * 2,  // Random value between 0 and 2
                    isSpeedTest: false
                });
            }
            return sampleData;
        }
        return history;
    };

    // Use the actual data or sample data if empty
    const dataToUse = bandwidthHistory.length > 0 ? bandwidthHistory : ensureData([]);

    const data = {
        labels: dataToUse.map(point => formatTime(point.timestamp)),
        datasets: [
            {
                label: 'Download',
                data: dataToUse.map((point, index) => ({
                    x: formatTime(point.timestamp),
                    y: point.download,
                    isSpeedTest: point.isSpeedTest
                })),
                borderColor: '#00FF00',
                backgroundColor: '#00FF00',
                tension: 0.4,
                pointRadius: (context: any) => {
                    const point = dataToUse[context.dataIndex];
                    return point.isSpeedTest ? 8 : 3;
                },
                pointStyle: (context: any) => {
                    const point = dataToUse[context.dataIndex];
                    return point.isSpeedTest ? 'star' : 'circle';
                },
                pointBackgroundColor: (context: any) => {
                    const point = dataToUse[context.dataIndex];
                    return point.isSpeedTest ? '#FFFF00' : '#00FF00';
                },
                pointBorderColor: (context: any) => {
                    const point = dataToUse[context.dataIndex];
                    return point.isSpeedTest ? '#FFFF00' : '#00FF00';
                }
            },
            {
                label: 'Upload',
                data: dataToUse.map((point, index) => ({
                    x: formatTime(point.timestamp),
                    y: point.upload,
                    isSpeedTest: point.isSpeedTest
                })),
                borderColor: '#00FFFF',
                backgroundColor: '#00FFFF',
                tension: 0.4,
                pointRadius: (context: any) => {
                    const point = dataToUse[context.dataIndex];
                    return point.isSpeedTest ? 8 : 3;
                },
                pointStyle: (context: any) => {
                    const point = dataToUse[context.dataIndex];
                    return point.isSpeedTest ? 'star' : 'circle';
                },
                pointBackgroundColor: (context: any) => {
                    const point = dataToUse[context.dataIndex];
                    return point.isSpeedTest ? '#FFFF00' : '#00FFFF';
                },
                pointBorderColor: (context: any) => {
                    const point = dataToUse[context.dataIndex];
                    return point.isSpeedTest ? '#FFFF00' : '#00FFFF';
                }
            }
        ]
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#FFFFFF',
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function (context: any) {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        const isSpeedTest = context.raw.isSpeedTest;
                        return `${label}: ${value.toFixed(1)} Mbps${isSpeedTest ? ' (Speed Test)' : ''}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: '#333333'
                },
                ticks: {
                    color: '#CCCCCC',
                    maxRotation: 45,
                    minRotation: 45
                }
            },
            y: {
                grid: {
                    color: '#333333'
                },
                ticks: {
                    color: '#CCCCCC'
                },
                title: {
                    display: true,
                    text: 'Speed (Mbps)',
                    color: '#CCCCCC'
                }
            }
        }
    };

    return (
        <div style={{ height: '400px', padding: '20px 10px' }}>
            <Line data={data} options={options} />
        </div>
    );
};

export default BandwidthUsageGraph; 