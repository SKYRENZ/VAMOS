import React from 'react';

interface IOMonitorProps {
    uploadSpeed: number;
    downloadSpeed: number;
    uploadPackets: number;
    downloadPackets: number;
    activeInterfaces: string[];
    bytesSent: number;
    bytesReceived: number;
}

const IOMonitor: React.FC<IOMonitorProps> = ({
    uploadSpeed,
    downloadSpeed,
    uploadPackets,
    downloadPackets,
    activeInterfaces,
    bytesSent,
    bytesReceived
}) => {
    const formatBytes = (bytes: number) => {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let value = bytes;
        let unitIndex = 0;

        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }

        return `${value.toFixed(2)} ${units[unitIndex]}`;
    };

    const formatSpeed = (speed: number) => {
        return `${speed.toFixed(2)} Mbps`;
    };

    return (
        <div className="card border-0 shadow-lg" style={{ backgroundColor: '#121212' }}>
            <div className="card-body">
                <h5 className="card-title mb-3" style={{ color: '#00FF00' }}>
                    <i className="fas fa-network-wired me-2"></i>
                    Network I/O Monitor
                </h5>

                <div className="row">
                    <div className="col-md-12 mb-4">
                        <div className="io-stat-card p-3 rounded" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                            <h6 className="mb-3" style={{ color: '#00FF00' }}>Network Traffic Summary</h6>

                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div style={{ width: '48%' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span style={{ color: '#CCCCCC' }}>Upload</span>
                                        <span style={{ color: '#00FF00' }}>{formatSpeed(uploadSpeed)}</span>
                                    </div>
                                    <div className="progress" style={{ height: '10px', backgroundColor: '#333333' }}>
                                        <div
                                            className="progress-bar"
                                            style={{
                                                width: `${Math.min(100, (uploadSpeed / 100) * 100)}%`,
                                                backgroundColor: '#33CCFF'
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                <div style={{ width: '48%' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span style={{ color: '#CCCCCC' }}>Download</span>
                                        <span style={{ color: '#00FF00' }}>{formatSpeed(downloadSpeed)}</span>
                                    </div>
                                    <div className="progress" style={{ height: '10px', backgroundColor: '#333333' }}>
                                        <div
                                            className="progress-bar"
                                            style={{
                                                width: `${Math.min(100, (downloadSpeed / 100) * 100)}%`,
                                                backgroundColor: '#00FF00'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="row mt-4">
                                <div className="col-md-6">
                                    <div className="text-center p-3" style={{ backgroundColor: '#151515', borderRadius: '8px' }}>
                                        <div style={{ color: '#CCCCCC', fontSize: '0.9rem', marginBottom: '5px' }}>Total Data Sent</div>
                                        <div style={{ color: '#33CCFF', fontSize: '1.4rem', fontWeight: 'bold' }}>{formatBytes(bytesSent)}</div>
                                        <div style={{ color: '#999999', fontSize: '0.8rem' }}>{uploadPackets.toLocaleString()} packets</div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="text-center p-3" style={{ backgroundColor: '#151515', borderRadius: '8px' }}>
                                        <div style={{ color: '#CCCCCC', fontSize: '0.9rem', marginBottom: '5px' }}>Total Data Received</div>
                                        <div style={{ color: '#00FF00', fontSize: '1.4rem', fontWeight: 'bold' }}>{formatBytes(bytesReceived)}</div>
                                        <div style={{ color: '#999999', fontSize: '0.8rem' }}>{downloadPackets.toLocaleString()} packets</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="network-interfaces-section">
                    <h6 className="mb-3" style={{ color: '#00FF00' }}>Active Network Interfaces</h6>
                    <div className="d-flex flex-wrap gap-2">
                        {activeInterfaces.map((iface, index) => (
                            <span
                                key={index}
                                className="badge"
                                style={{
                                    backgroundColor: '#1a1a1a',
                                    color: '#00FF00',
                                    border: '1px solid #333',
                                    padding: '0.5rem 1rem'
                                }}
                            >
                                <i className="fas fa-network-wired me-1"></i>
                                {iface}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IOMonitor; 