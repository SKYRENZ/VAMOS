import React from 'react';
import './CircularGaugeSpeedTest.css';

interface CircularGaugeSpeedTestProps {
    isRunning: boolean;
    downloadSpeed: number | null;
    uploadSpeed: number | null;
    ping: number | null;
    onStartTest: () => void;
}

const CircularGaugeSpeedTest: React.FC<CircularGaugeSpeedTestProps> = ({
    isRunning,
    downloadSpeed,
    uploadSpeed,
    ping,
    onStartTest
}) => {
    // Calculate the angle for the arc (in radians)
    const calculateStrokeLength = (value: number, max: number) => {
        const ratio = value / max;
        return ratio * 265; // ~3/4 of a circle (270 degrees)
    };

    // Format speed numbers
    const formatSpeed = (speed: number | null) => {
        if (speed === null) return '--';
        return speed.toFixed(2);
    };

    return (
        <div className="gauge-container">
            {/* PING Gauge */}
            <div className="gauge ping-gauge">
                <svg viewBox="0 0 120 120">
                    <circle
                        className="gauge-bg"
                        cx="60"
                        cy="60"
                        r="54"
                    />
                    <circle
                        className="gauge-progress"
                        cx="60"
                        cy="60"
                        r="54"
                        strokeDasharray={`${calculateStrokeLength(ping || 0, 100)} 1000`}
                        stroke="#FFCC00"
                    />
                    <text x="60" y="55" className="gauge-value">
                        {ping || 0}
                    </text>
                    <text x="60" y="70" className="gauge-label">ms</text>
                    <g className="gauge-icon">
                        <circle cx="60" cy="95" r="8" className="icon-bg" />
                        <path d="M60 90 L60 100 M56 93 L64 97" className="icon-symbol" stroke="#FFCC00" />
                    </g>
                </svg>
                <div className="gauge-title">PING</div>
                <div className="gauge-subtitle">Delays in transfer</div>
            </div>

            {/* DOWNLOAD Gauge */}
            <div className="gauge download-gauge">
                <svg viewBox="0 0 120 120">
                    <circle
                        className="gauge-bg"
                        cx="60"
                        cy="60"
                        r="54"
                    />
                    <circle
                        className="gauge-progress"
                        cx="60"
                        cy="60"
                        r="54"
                        strokeDasharray={`${calculateStrokeLength(downloadSpeed || 0, 100)} 1000`}
                        stroke="#00FF00"
                    />
                    <text x="60" y="55" className="gauge-value">
                        {formatSpeed(downloadSpeed || 0)}
                    </text>
                    <text x="60" y="70" className="gauge-label">Mbit/s</text>
                    <g className="gauge-icon">
                        <circle cx="60" cy="95" r="8" className="icon-bg" />
                        <path d="M60 90 L60 100 M56 93 L60 97 L64 93" className="icon-symbol" stroke="#00FF00" />
                    </g>
                </svg>
                <div className="gauge-title">DOWNLOAD</div>
                <div className="gauge-subtitle">Speed of download</div>
            </div>

            {/* UPLOAD Gauge */}
            <div className="gauge upload-gauge">
                <svg viewBox="0 0 120 120">
                    <circle
                        className="gauge-bg"
                        cx="60"
                        cy="60"
                        r="54"
                    />
                    <circle
                        className="gauge-progress"
                        cx="60"
                        cy="60"
                        r="54"
                        strokeDasharray={`${calculateStrokeLength(uploadSpeed || 0, 100)} 1000`}
                        stroke="#33CC33"
                    />
                    <text x="60" y="55" className="gauge-value">
                        {formatSpeed(uploadSpeed || 0)}
                    </text>
                    <text x="60" y="70" className="gauge-label">Mbit/s</text>
                    <g className="gauge-icon">
                        <circle cx="60" cy="95" r="8" className="icon-bg" />
                        <path d="M60 90 L60 100 M56 97 L60 93 L64 97" className="icon-symbol" stroke="#33CC33" />
                    </g>
                </svg>
                <div className="gauge-title">UPLOAD</div>
                <div className="gauge-subtitle">Speed of upload</div>
            </div>

            <div className="start-button-container">
                <button
                    className="start-button"
                    onClick={onStartTest}
                    disabled={isRunning}
                >
                    {isRunning ? 'SCANNING...' : 'START'}
                </button>
            </div>
        </div>
    );
};

export default CircularGaugeSpeedTest; 