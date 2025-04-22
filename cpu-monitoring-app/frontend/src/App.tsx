import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Battery from './pages/Battery';
import Network from './pages/Network';
import BottomNav from './components/BottomNav';
import GetStarted from './pages/GetStarted';
import SpeedTestNotification from './components/SpeedTestNotification';



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
        dataReady: boolean;
    }>({
        speedTestCompleted: false,
        speedTestData: null,
        isRunningSpeedTest: false,
        scanProgress: 0,
        currentPhase: "",
        error: null,
        dataReady: false
    });

    // Reset network state when app starts
    useEffect(() => {
        setNetworkState({
            speedTestCompleted: false,
            speedTestData: null,
            isRunningSpeedTest: false,
            scanProgress: 0,
            currentPhase: "",
            error: null,
            dataReady: false
        });
    }, []);

    // Check for an ongoing speed test when the component mounts
    // This helps resume the test visualization if the user navigates back
    useEffect(() => {
        const checkSpeedTestStatus = async () => {
            try {
                if (networkState.isRunningSpeedTest) {
                    // The test was already running, no need to check status
                    return;
                }

                // Check if a test is running on the server
                const response = await fetch(`${API_URL}/speedtest/status`);
                const data = await response.json();

                if (data.running) {
                    // A test is running on the server, update our local state
                    setNetworkState(prev => ({
                        ...prev,
                        isRunningSpeedTest: true,
                        scanProgress: data.progress || 0,
                        currentPhase: data.phase || "Testing in progress...",
                    }));
                }
            } catch (error) {
                console.error("Failed to check speed test status:", error);
            }
        };

        checkSpeedTestStatus();
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

            // Start the speed test and get initial status
            const response = await fetch(`${API_URL}/speedtest`);
            const initialData = await response.json();

            if (initialData.error) {
                setNetworkState(prev => ({
                    ...prev,
                    error: initialData.error,
                    isRunningSpeedTest: false
                }));
                return;
            }

            console.log("Speed test started:", initialData);

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

            // Keep checking the status until the test is complete
            let testComplete = false;
            let finalData = null;

            // Poll for status every 1 second until complete
            while (!testComplete) {
                try {
                    const statusResponse = await fetch(`${API_URL}/speedtest/status`);
                    const statusData = await statusResponse.json();

                    console.log("Speed test status:", statusData);

                    // Update UI with current progress
                    setNetworkState(prev => ({
                        ...prev,
                        currentPhase: statusData.phase || "Processing...",
                        scanProgress: statusData.progress || 99
                    }));

                    // Check if test is complete
                    if (!statusData.running) {
                        testComplete = true;

                        // Get the final data
                        const allDataResponse = await fetch(`${API_URL}/all`);
                        finalData = await allDataResponse.json();
                    } else {
                        // Wait before polling again
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (error) {
                    console.error("Error checking speed test status:", error);
                    // Wait before trying again
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

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

            // Get the final speed test data
            const speedTestResponse = await fetch(`${API_URL}/speedtest/result`);
            const speedTestData = await speedTestResponse.json();

            // Update the network state with results
            setNetworkState(prev => ({
                ...prev,
                speedTestData: speedTestData,
                speedTestCompleted: true,
                isRunningSpeedTest: false
            }));

            // If there's already collected data, make sure it's shown immediately
            if (finalData && finalData.bandwidthHistory && finalData.bandwidthHistory.length > 0) {
                console.log("Found existing network data after speed test");

                // Update UI to show all the existing data immediately
                setNetworkState(prev => ({
                    ...prev,
                    speedTestCompleted: true,
                    dataReady: true
                }));
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

            {/* Speed Test Notification - visible on all pages */}
            <SpeedTestNotification networkState={networkState} />
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
