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
    // Helper function to determine color based on ping
    const getPingColor = (ping: number) => {
        if (ping === 0) return "#808080";
        if (ping < 30) return "#00FF00";
        if (ping < 60) return "#66FF66";
        if (ping < 100) return "#FFCC00";
        return "#FF3333";
    };

    // Helper function to determine color based on jitter
    const getJitterColor = (jitter: number) => {
        if (jitter === 0) return "#808080";
        if (jitter < 5) return "#00FF00";
        if (jitter < 15) return "#66FF66";
        if (jitter < 30) return "#FFCC00";
        return "#FF3333";
    };

    // Helper function to determine color based on stability
    const getStabilityColor = (stability: number) => {
        if (stability === 0) return "#808080";
        if (stability > 90) return "#00FF00";
        if (stability > 75) return "#66FF66";
        if (stability > 50) return "#FFCC00";
        return "#FF3333";
    };

    // Helper function to determine quality rating text
    const getQualityRating = (stability: number) => {
        if (stability === 0) return "Not tested";
        if (stability > 90) return "Excellent";
        if (stability > 75) return "Good";
        if (stability > 50) return "Fair";
        return "Poor";
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

            {latencyHistory.length > 0 && (
                <div className="row mt-4">
                    <div className="col-12">
                        <div style={{ backgroundColor: '#0A0A0A', padding: '10px', borderRadius: '8px' }}>
                            <small style={{ color: '#CCCCCC' }}>Latency History (ms)</small>
                            <div className="d-flex justify-content-between mt-2" style={{ height: '40px' }}>
                                {latencyHistory.map((latency, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            width: `${100 / latencyHistory.length - 2}%`,
                                            height: `${Math.min(100, (latency / 150) * 100)}%`,
                                            backgroundColor: getPingColor(latency),
                                            marginRight: '2px'
                                        }}
                                        title={`${latency} ms`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConnectionQualityMonitor; 