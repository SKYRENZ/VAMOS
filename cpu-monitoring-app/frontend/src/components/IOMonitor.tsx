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
                    <div className="col-md-6 mb-4">
                        <div className="io-stat-card p-3 rounded" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                            <h6 className="mb-3" style={{ color: '#00FF00' }}>Upload Statistics</h6>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span style={{ color: '#CCCCCC' }}>Speed</span>
                                <span style={{ color: '#00FF00' }}>{formatSpeed(uploadSpeed)}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span style={{ color: '#CCCCCC' }}>Packets</span>
                                <span style={{ color: '#00FF00' }}>{uploadPackets} pkt/s</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span style={{ color: '#CCCCCC' }}>Total Sent</span>
                                <span style={{ color: '#00FF00' }}>{formatBytes(bytesSent)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6 mb-4">
                        <div className="io-stat-card p-3 rounded" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                            <h6 className="mb-3" style={{ color: '#00FF00' }}>Download Statistics</h6>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span style={{ color: '#CCCCCC' }}>Speed</span>
                                <span style={{ color: '#00FF00' }}>{formatSpeed(downloadSpeed)}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span style={{ color: '#CCCCCC' }}>Packets</span>
                                <span style={{ color: '#00FF00' }}>{downloadPackets} pkt/s</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span style={{ color: '#CCCCCC' }}>Total Received</span>
                                <span style={{ color: '#00FF00' }}>{formatBytes(bytesReceived)}</span>
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