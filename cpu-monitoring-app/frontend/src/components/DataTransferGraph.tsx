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
    Filler,
    ChartOptions
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface DataTransferPoint {
    timestamp: string;
    totalBytesSent: number;
    totalBytesReceived: number;
    totalBytesSentFormatted: string;
    totalBytesReceivedFormatted: string;
}

interface DataTransferGraphProps {
    dataTransferHistory: DataTransferPoint[];
    timeRange: '5min' | '1hour' | '1day';
}

const DataTransferGraph: React.FC<DataTransferGraphProps> = ({
    dataTransferHistory,
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

    // Format data size to appropriate units for display
    const formatDataSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Generate sample data if history is empty (for development/testing)
    const ensureData = (history: DataTransferPoint[]) => {
        if (history.length === 0) {
            // Create sample data for development/testing
            const now = new Date();
            const sampleData = [];
            let cumulativeSent = 0;
            let cumulativeReceived = 0;

            for (let i = 0; i < 10; i++) {
                cumulativeSent += Math.random() * 1024 * 1024 * 5; // 0-5 MB increments
                cumulativeReceived += Math.random() * 1024 * 1024 * 10; // 0-10 MB increments

                const time = new Date(now.getTime() - (9 - i) * 30000); // 30 seconds intervals
                sampleData.push({
                    timestamp: time.toISOString(),
                    totalBytesSent: cumulativeSent,
                    totalBytesReceived: cumulativeReceived,
                    totalBytesSentFormatted: formatDataSize(cumulativeSent),
                    totalBytesReceivedFormatted: formatDataSize(cumulativeReceived)
                });
            }
            return sampleData;
        }
        return history;
    };

    // Use the actual data or sample data if empty
    const dataToUse = dataTransferHistory.length > 0 ? dataTransferHistory : ensureData([]);

    const data = {
        labels: dataToUse.map(item => formatLabel(item.timestamp)),
        datasets: [
            {
                label: 'Downloaded',
                data: dataToUse.map(item => item.totalBytesReceived),
                borderColor: '#00FF00',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                tension: 0.3,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 5,
            },
            {
                label: 'Uploaded',
                data: dataToUse.map(item => item.totalBytesSent),
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
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#FFFFFF',
                bodyColor: '#CCCCCC',
                borderColor: '#333333',
                borderWidth: 1,
                callbacks: {
                    label: (context) => {
                        const dataIndex = context.dataIndex;
                        const datasetIndex = context.datasetIndex;

                        if (datasetIndex === 0) {
                            return `Downloaded: ${dataToUse[dataIndex].totalBytesReceivedFormatted}`;
                        } else {
                            return `Uploaded: ${dataToUse[dataIndex].totalBytesSentFormatted}`;
                        }
                    }
                }
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
                ticks: {
                    color: '#CCCCCC',
                    callback: function (value) {
                        return formatDataSize(value as number);
                    }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                title: {
                    display: true,
                    text: 'Data Volume',
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

export default DataTransferGraph; 