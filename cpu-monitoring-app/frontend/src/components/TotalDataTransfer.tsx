import React from 'react';

interface TotalDataTransferProps {
    totalSent: number;
    totalReceived: number;
    sentFormatted: string;
    receivedFormatted: string;
}

const TotalDataTransfer: React.FC<TotalDataTransferProps> = ({
    totalSent,
    totalReceived,
    sentFormatted,
    receivedFormatted
}) => {
    return (
        <div className="total-data-transfer">
            <h5 className="card-title mb-3" style={{ color: '#00FF00' }}>
                <i className="fas fa-exchange-alt me-2"></i>
                Total Data Transferred
            </h5>

            <div className="row mb-3">
                <div className="col-6">
                    <div className="card" style={{ backgroundColor: '#1a1a1a', border: 'none' }}>
                        <div className="card-body text-center">
                            <div className="mb-2">
                                <i className="fas fa-cloud-download-alt" style={{ fontSize: '2rem', color: '#00FF00' }}></i>
                            </div>
                            <h2 style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{receivedFormatted}</h2>
                            <p style={{ color: '#CCCCCC' }}>Downloaded</p>
                        </div>
                    </div>
                </div>

                <div className="col-6">
                    <div className="card" style={{ backgroundColor: '#1a1a1a', border: 'none' }}>
                        <div className="card-body text-center">
                            <div className="mb-2">
                                <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2rem', color: '#33CCFF' }}></i>
                            </div>
                            <h2 style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{sentFormatted}</h2>
                            <p style={{ color: '#CCCCCC' }}>Uploaded</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div style={{ backgroundColor: '#0A0A0A', padding: '15px', borderRadius: '8px' }}>
                        <p className="mb-1" style={{ color: '#CCCCCC', fontSize: '0.9rem' }}>
                            <i className="fas fa-info-circle me-2"></i>
                            This shows the total data transferred since the monitoring started. Reset when the app is restarted.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TotalDataTransfer; 