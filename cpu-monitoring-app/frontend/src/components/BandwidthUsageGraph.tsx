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

interface BandwidthDataPoint {
    timestamp: string;
    download: number;
    upload: number;
    downloadFormatted?: string;
    uploadFormatted?: string;
}

interface DataTransferInfo {
    totalSent: number;
    totalReceived: number;
    sentFormatted: string;
    receivedFormatted: string;
}

interface BandwidthUsageGraphProps {
    bandwidthHistory: BandwidthDataPoint[];
    timeRange: '5min' | '1hour' | '1day';
    totalDataTransfer?: DataTransferInfo;
}

const BandwidthUsageGraph: React.FC<BandwidthUsageGraphProps> = ({
    bandwidthHistory,
    timeRange,
    totalDataTransfer
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
    const ensureData = (history: BandwidthDataPoint[]) => {
        if (history.length === 0) {
            // Create sample data for development/testing
            const now = new Date();
            const sampleData = [];
            for (let i = 0; i < 10; i++) {
                const downloadBytes = Math.floor(Math.random() * 1024 * 1024 * 2); // 0-2 MB
                const uploadBytes = Math.floor(Math.random() * 1024 * 1024); // 0-1 MB

                const time = new Date(now.getTime() - (9 - i) * 30000); // 30 seconds intervals
                sampleData.push({
                    timestamp: time.toISOString(),
                    download: downloadBytes,
                    upload: uploadBytes,
                    downloadFormatted: formatDataSize(downloadBytes),
                    uploadFormatted: formatDataSize(uploadBytes)
                });
            }
            return sampleData;
        }
        return history;
    };

    // Use the actual data or sample data if empty
    const dataToUse = bandwidthHistory.length > 0 ? bandwidthHistory : ensureData([]);

    const bandwidthChartData = {
        labels: dataToUse.map(item => formatLabel(item.timestamp)),
        datasets: [
            {
                label: 'Downloaded',
                data: dataToUse.map(item => item.download),
                borderColor: '#00FF00',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                tension: 0.3,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 5,
            },
            {
                label: 'Uploaded',
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

    const bandwidthOptions: ChartOptions<'line'> = {
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
                callbacks: {
                    label: (context) => {
                        const dataIndex = context.dataIndex;
                        const datasetIndex = context.datasetIndex;

                        if (datasetIndex === 0) {
                            return `Downloaded: ${dataToUse[dataIndex].downloadFormatted || formatDataSize(dataToUse[dataIndex].download)}`;
                        } else {
                            return `Uploaded: ${dataToUse[dataIndex].uploadFormatted || formatDataSize(dataToUse[dataIndex].upload)}`;
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
                min: 0,
                grace: '5%'
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
            <div className="mb-4 text-center">
                <p style={{ color: '#CCCCCC', fontSize: '0.9rem' }}>
                    <i className="fas fa-info-circle me-2"></i>
                    Data transferred every 30 seconds
                </p>
            </div>
            <Line data={bandwidthChartData} options={bandwidthOptions} />

            {totalDataTransfer && (
                <div className="mt-3">
                    <div className="d-flex justify-content-between">
                        <div style={{ color: '#CCCCCC' }}>
                            <i className="fas fa-cloud-download-alt me-2" style={{ color: '#00FF00' }}></i>
                            Total Downloaded: <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{totalDataTransfer.receivedFormatted}</span>
                        </div>
                        <div style={{ color: '#CCCCCC' }}>
                            <i className="fas fa-cloud-upload-alt me-2" style={{ color: '#33CCFF' }}></i>
                            Total Uploaded: <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{totalDataTransfer.sentFormatted}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BandwidthUsageGraph; 