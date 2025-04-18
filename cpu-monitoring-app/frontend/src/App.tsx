import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Battery from './pages/Battery';
import Network from './pages/Network';
import BottomNav from './components/BottomNav';
import GetStarted from './pages/GetStarted';

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

// API URL constant
const API_URL = 'http://localhost:5000/api';

const AppContent = () => {
    const location = useLocation();
    const [networkState, setNetworkState] = useState<{
        speedTestCompleted: boolean;
        speedTestData: SpeedTestResult | null;
        isRunningSpeedTest: boolean;
        scanProgress: number;
        currentPhase: string;
        error: string | null;
    }>({
        speedTestCompleted: false,
        speedTestData: null,
        isRunningSpeedTest: false,
        scanProgress: 0,
        currentPhase: "",
        error: null
    });

    // Reset network state when app starts
    useEffect(() => {
        setNetworkState({
            speedTestCompleted: false,
            speedTestData: null,
            isRunningSpeedTest: false,
            scanProgress: 0,
            currentPhase: "",
            error: null
        });
    }, []);

    // Function to run the speed test
    const handleRunSpeedTest = async () => {
        try {
            setNetworkState(prev => ({
                ...prev,
                isRunningSpeedTest: true,
                scanProgress: 0,
                speedTestData: null,
                error: null
            }));

            // Start the actual speed test immediately in parallel with the animation
            const speedTestPromise = fetch(`${API_URL}/speedtest`).then(res => res.json());

            // Simulate smooth progress updates based on speed test phases
            const phases = [
                { name: "Finding best server...", duration: 5000, progress: 20 },
                { name: "Testing download speed...", duration: 8000, progress: 50 },
                { name: "Testing upload speed...", duration: 8000, progress: 80 },
                { name: "Finalizing results...", duration: 2000, progress: 99 }
            ];

            // Run animation in parallel with the actual test
            for (const phase of phases) {
                setNetworkState(prev => ({ ...prev, currentPhase: phase.name }));
                const startTime = Date.now();
                const endTime = startTime + phase.duration;
                const startProgress = phases.indexOf(phase) > 0 ? phases[phases.indexOf(phase) - 1].progress : 0;

                const updateProgress = () => {
                    const now = Date.now();
                    const elapsed = now - startTime;
                    const progress = Math.min(
                        phase.progress,
                        startProgress + (elapsed / phase.duration) * (phase.progress - startProgress)
                    );

                    setNetworkState(prev => ({ ...prev, scanProgress: progress }));

                    if (now < endTime) {
                        requestAnimationFrame(updateProgress);
                    }
                };

                await new Promise<void>((resolve) => {
                    updateProgress();
                    setTimeout(resolve, phase.duration);
                });
            }

            // Keep at 99% while waiting for actual results if they're not ready yet
            setNetworkState(prev => ({
                ...prev,
                currentPhase: "Processing results...",
                scanProgress: 99
            }));

            // Wait for the actual speed test to complete
            const data = await speedTestPromise;

            // Check if the response contains an error
            if (data.error) {
                setNetworkState(prev => ({
                    ...prev,
                    error: data.error,
                    speedTestData: null,
                    isRunningSpeedTest: false
                }));
            } else {
                // Smooth transition to 100%
                const startTime = Date.now();
                const duration = 500; // 0.5 seconds to reach 100%

                const updateTo100 = () => {
                    const now = Date.now();
                    const elapsed = now - startTime;
                    const progress = Math.min(100, 99 + (elapsed / duration));

                    setNetworkState(prev => ({ ...prev, scanProgress: progress }));

                    if (progress < 100) {
                        requestAnimationFrame(updateTo100);
                    } else {
                        setNetworkState(prev => ({ ...prev, currentPhase: "Test completed!" }));
                    }
                };

                updateTo100();

                // Update the network state with results
                setNetworkState(prev => ({
                    ...prev,
                    speedTestData: data,
                    speedTestCompleted: true,
                    isRunningSpeedTest: false
                }));

                // Fetch all network data after speed test completes
                await fetch(`${API_URL}/all`);
            }
        } catch (err) {
            console.error('Error running speed test:', err);
            setNetworkState(prev => ({
                ...prev,
                error: 'Failed to run speed test.',
                isRunningSpeedTest: false
            }));
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Page Content */}
            <div className="flex-grow">
                <Routes>
                    <Route path="/" element={<GetStarted />} />
                    <Route path="/home" element={<Home networkState={networkState} />} />
                    <Route path="/battery" element={<Battery networkState={networkState} />} />
                    <Route path="/network" element={
                        <Network
                            networkState={networkState}
                            setNetworkState={setNetworkState}
                            onRunSpeedTest={handleRunSpeedTest}
                        />
                    } />
                </Routes>
            </div>

            {/* Show BottomNav only if NOT on GetStarted */}
            {location.pathname !== "/" && <BottomNav />}
        </div>
    );
};

const App = () => {
    return (
        <Router>
            <AppContent />
        </Router>
    );
};

export default App;
