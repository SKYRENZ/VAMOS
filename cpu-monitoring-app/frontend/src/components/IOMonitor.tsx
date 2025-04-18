import React from 'react';

interface IOMonitorProps {
    activeInterfaces: string[];
}

const IOMonitor: React.FC<IOMonitorProps> = ({
    activeInterfaces
}) => {
    return (
        <div className="card border-0 shadow-lg" style={{ backgroundColor: '#121212' }}>
            <div className="card-body">
                <h5 className="card-title mb-3" style={{ color: '#00FF00' }}>
                    <i className="fas fa-network-wired me-2"></i>
                    Active Network Interfaces
                </h5>

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
    );
};

export default IOMonitor; 