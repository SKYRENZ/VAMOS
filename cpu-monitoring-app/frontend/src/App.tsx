import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { useState } from 'react';
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

const AppContent = () => {
    const location = useLocation(); // Get the current route
    const [networkState, setNetworkState] = useState<{
        speedTestCompleted: boolean;
        speedTestData: SpeedTestResult | null;
    }>({
        speedTestCompleted: false,
        speedTestData: null
    });

    return (
        <div className="flex flex-col min-h-screen">
            {/* Page Content */}
            <div className="flex-grow">
                <Routes>
                    <Route path="/" element={<GetStarted />} /> {/* Default page */}
                    <Route path="/home" element={<Home />} />
                    <Route path="/battery" element={<Battery />} />
                    <Route path="/network" element={
                        <Network
                            networkState={networkState}
                            setNetworkState={setNetworkState}
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
