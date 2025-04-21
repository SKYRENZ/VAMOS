import React from 'react';

interface ConnectionQualityProps {
    ping: number;
    jitter: number;
    packetLoss: number;
    stability: number;
    latencyHistory: number[];
}

const ConnectionQualityMonitor: React.FC<ConnectionQualityProps> = ({
    ping,
    jitter,
    packetLoss,
    stability,
    latencyHistory
}) => {
    // Helper functions for color determination
    const getPingColor = (ping: number) => {
        if (ping < 20) return '#00FF00';  // Excellent
        if (ping < 50) return '#66FF66';  // Very Good
        if (ping < 100) return '#FFCC00'; // Good
        if (ping < 150) return '#FF9900'; // Fair
        return '#FF3333';                 // Poor
    };

    const getJitterColor = (jitter: number) => {
        if (jitter < 5) return '#00FF00';   // Excellent
        if (jitter < 10) return '#66FF66';  // Very Good
        if (jitter < 20) return '#FFCC00';  // Good
        if (jitter < 30) return '#FF9900';  // Fair
        return '#FF3333';                   // Poor
    };

    const getStabilityColor = (stability: number) => {
        if (stability >= 90) return '#00FF00';  // Excellent
        if (stability >= 75) return '#66FF66';  // Very Good
        if (stability >= 60) return '#FFCC00';  // Good
        if (stability >= 40) return '#FF9900';  // Fair
        return '#FF3333';                       // Poor
    };

    const getQualityRating = (stability: number) => {
        if (stability >= 90) return 'Excellent';
        if (stability >= 75) return 'Very Good';
        if (stability >= 60) return 'Good';
        if (stability >= 40) return 'Fair';
        return 'Poor';
    };

    return (
        <div className="connection-quality">
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-center mb-3">
                        <div
                            className="quality-score-circle d-flex align-items-center justify-content-center"
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                backgroundColor: '#121212',
                                border: `4px solid ${getStabilityColor(stability)}`
                            }}
                        >
                            <div className="text-center">
                                <h3 style={{ color: getStabilityColor(stability), margin: 0 }}>{stability}%</h3>
                                <small style={{ color: '#CCCCCC' }}>Stability</small>
                            </div>
                        </div>
                    </div>
                    <div className="text-center mb-4">
                        <h4 style={{ color: getStabilityColor(stability) }}>{getQualityRating(stability)}</h4>
                        <p style={{ color: '#CCCCCC' }}>Connection Quality</p>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-6 mb-3">
                    <div className="quality-metric p-3" style={{ backgroundColor: '#0A0A0A', borderRadius: '8px' }}>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <small style={{ color: '#CCCCCC' }}>
                                    <i className="fas fa-stopwatch me-2"></i>
                                    Ping
                                </small>
                            </div>
                            <div>
                                <span style={{ color: getPingColor(ping), fontWeight: 'bold' }}>
                                    {ping} ms
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-6 mb-3">
                    <div className="quality-metric p-3" style={{ backgroundColor: '#0A0A0A', borderRadius: '8px' }}>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <small style={{ color: '#CCCCCC' }}>
                                    <i className="fas fa-random me-2"></i>
                                    Jitter
                                </small>
                            </div>
                            <div>
                                <span style={{ color: getJitterColor(jitter), fontWeight: 'bold' }}>
                                    {jitter} ms
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12">
                    <div className="quality-metric p-3" style={{ backgroundColor: '#0A0A0A', borderRadius: '8px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <small style={{ color: '#CCCCCC' }}>
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    Packet Loss
                                </small>
                            </div>
                            <div>
                                <span style={{
                                    color: packetLoss === 0 ? '#00FF00' : packetLoss < 2 ? '#FFCC00' : '#FF3333',
                                    fontWeight: 'bold'
                                }}>
                                    {packetLoss}%
                                </span>
                            </div>
                        </div>

                        <div className="progress" style={{ backgroundColor: '#000000', height: "5px" }}>
                            <div
                                className="progress-bar"
                                role="progressbar"
                                style={{
                                    width: `${100 - packetLoss}%`,
                                    backgroundColor: packetLoss === 0 ? '#00FF00' : packetLoss < 2 ? '#FFCC00' : '#FF3333',
                                }}
                                aria-valuenow={100 - packetLoss}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Removed latency history section */}
        </div>
    );
};

export default ConnectionQualityMonitor; 