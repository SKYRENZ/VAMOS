import React, { useState, useEffect } from 'react';

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
        dataReady: boolean;
    };
}

const SpeedTestNotification: React.FC<SpeedTestNotificationProps> = ({ networkState }) => {
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);

    // Track when speed test completes to show completion message
    useEffect(() => {
        if (!networkState.isRunningSpeedTest && showCompletionMessage) {
            // Set a timeout to hide the completion message after 7 seconds
            const timer = setTimeout(() => {
                setShowCompletionMessage(false);
            }, 7000);

            return () => clearTimeout(timer);
        }

        // If speed test is running, prepare to show completion message
        if (networkState.isRunningSpeedTest) {
            setShowCompletionMessage(true);
        }
    }, [networkState.isRunningSpeedTest]);

    // Don't show anything if speed test is not running and completion message is gone
    if (!networkState.isRunningSpeedTest && !showCompletionMessage) {
        return null;
    }

    // Define the styles for the notification
    const notificationStyles = {
        position: 'fixed' as const,
        bottom: '80px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#00FF00',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: networkState.isRunningSpeedTest
            ? '0 0 10px rgba(0, 255, 0, 0.3)'
            : '0 0 15px rgba(0, 255, 0, 0.6)',
        zIndex: 1000,
        maxWidth: '300px',
        transition: 'all 0.5s ease',
        animation: !networkState.isRunningSpeedTest ? 'pulse 2s infinite' : 'none',
    };

    // Define the pulse animation
    const keyframesStyle = `
        @keyframes pulse {
            0% {
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
            }
            50% {
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
            }
            100% {
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
            }
        }
    `;

    return (
        <>
            <style>{keyframesStyle}</style>
            <div style={notificationStyles}>
                <div className="d-flex align-items-center mb-2">
                    <i className={`fas ${networkState.isRunningSpeedTest ? 'fa-tachometer-alt' : 'fa-check-circle'} me-2`}></i>
                    <span style={{ fontWeight: 'bold' }}>
                        {networkState.isRunningSpeedTest ? 'Speed Test Running' : 'Speed Test Complete'}
                    </span>
                </div>

                {networkState.isRunningSpeedTest ? (
                    <>
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
                    </>
                ) : (
                    <div style={{ fontSize: '0.9rem', color: '#CCCCCC' }}>
                        <div className="mb-2">Network data has been refreshed successfully</div>
                        {networkState.speedTestData && (
                            <div className="speed-results d-flex flex-column">
                                <div className="mb-1" style={{ color: '#00FF00' }}>
                                    <i className="fas fa-download me-1"></i>
                                    Download: <strong>{networkState.speedTestData.download.toFixed(1)} Mbps</strong>
                                </div>
                                <div className="mb-1" style={{ color: '#33CC33' }}>
                                    <i className="fas fa-upload me-1"></i>
                                    Upload: <strong>{networkState.speedTestData.upload.toFixed(1)} Mbps</strong>
                                </div>
                                <div style={{ color: '#FFCC00' }}>
                                    <i className="fas fa-bolt me-1"></i>
                                    Ping: <strong>{networkState.speedTestData.ping.toFixed(0)} ms</strong>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default SpeedTestNotification; 