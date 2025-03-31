import React from 'react';
import './SpeedTestProgress.css';

interface SpeedTestProgressProps {
    isRunning: boolean;
    currentPhase: 'preparing' | 'download' | 'upload' | 'complete';
    downloadSpeed: number | null;
    uploadSpeed: number | null;
    ping: number | null;
}

export const SpeedTestProgress: React.FC<SpeedTestProgressProps> = ({
    isRunning,
    currentPhase,
    downloadSpeed,
    uploadSpeed,
    ping
}) => {
    const getProgress = () => {
        switch (currentPhase) {
            case 'preparing':
                return 25;
            case 'download':
                return 50;
            case 'upload':
                return 75;
            case 'complete':
                return 100;
            default:
                return 0;
        }
    };

    const getPhaseText = () => {
        switch (currentPhase) {
            case 'preparing':
                return 'Finding optimal server...';
            case 'download':
                return 'Testing download speed...';
            case 'upload':
                return 'Testing upload speed...';
            case 'complete':
                return 'Test complete';
            default:
                return 'Ready to test';
        }
    };

    return (
        <div className="speed-test-progress">
            <div className="progress-circle-container">
                <div className="progress-circle">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#2a2a2a"
                            strokeWidth="8"
                        />
                        {/* Progress circle */}
                        {isRunning && (
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="#00ff00"
                                strokeWidth="8"
                                strokeDasharray={`${2 * Math.PI * 45 * getProgress() / 100} ${2 * Math.PI * 45}`}
                                strokeDashoffset={2 * Math.PI * 45 / 4}
                                transform="rotate(-90 50 50)"
                                style={{
                                    transition: 'stroke-dasharray 0.5s ease-in-out'
                                }}
                            />
                        )}
                        {/* Center text */}
                        <text
                            x="50"
                            y="45"
                            textAnchor="middle"
                            fill="#fff"
                            fontSize="8"
                            fontFamily="Arial"
                            className="progress-text"
                        >
                            {currentPhase === 'complete' ? 'COMPLETE' : 'TESTING'}
                        </text>
                        <text
                            x="50"
                            y="55"
                            textAnchor="middle"
                            fill="#888"
                            fontSize="6"
                            fontFamily="Arial"
                            className="phase-text"
                        >
                            {getPhaseText()}
                        </text>
                    </svg>
                </div>
            </div>

            <div className="speed-results">
                <div className="result-item">
                    <span className="label">Download</span>
                    <span className="value">
                        {downloadSpeed !== null ? `${downloadSpeed.toFixed(1)} Mbps` : '--'}
                    </span>
                </div>
                <div className="result-item">
                    <span className="label">Upload</span>
                    <span className="value">
                        {uploadSpeed !== null ? `${uploadSpeed.toFixed(1)} Mbps` : '--'}
                    </span>
                </div>
                <div className="result-item">
                    <span className="label">Ping</span>
                    <span className="value">
                        {ping !== null ? `${ping.toFixed(0)} ms` : '--'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SpeedTestProgress; 