import React from 'react';

interface SpeedTestResult {
    download: number;
    upload: number;
    ping: number;
    server?: {
        name: string;
        location: string;
        sponsor: string;
        latency: number;
        distance: string;
    };
}

interface SpeedTestNotificationProps {
    networkState: {
        speedTestCompleted: boolean;
        speedTestData: SpeedTestResult | null;
        isRunningSpeedTest: boolean;
        scanProgress: number;
        currentPhase: string;
        error: string | null;
    };
}

const SpeedTestNotification: React.FC<SpeedTestNotificationProps> = ({ networkState }) => {
    if (!networkState.isRunningSpeedTest) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '80px',
                right: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: '#00FF00',
                padding: '15px',
                borderRadius: '10px',
                boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)',
                zIndex: 1000,
                maxWidth: '300px'
            }}
        >
            <div className="d-flex align-items-center mb-2">
                <i className="fas fa-tachometer-alt me-2"></i>
                <span style={{ fontWeight: 'bold' }}>Speed Test Running</span>
            </div>
            <div className="progress mb-2" style={{ height: '8px', backgroundColor: '#333' }}>
                <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                        width: `${networkState.scanProgress}%`,
                        backgroundColor: '#00FF00'
                    }}
                    aria-valuenow={networkState.scanProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                ></div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#CCCCCC' }}>
                {networkState.currentPhase} ({Math.round(networkState.scanProgress)}%)
            </div>
        </div>
    );
};

export default SpeedTestNotification; 