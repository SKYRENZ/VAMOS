import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Battery from './pages/Battery';
import Network from './pages/Network';
import BottomNav from './components/BottomNav';
import GetStarted from './pages/GetStarted';

const AppContent = () => {
    const location = useLocation(); // Get the current route

    return (
        <div className="flex flex-col min-h-screen">
            {/* Page Content */}
            <div className="flex-grow">
                <Routes>
                    <Route path="/" element={<GetStarted />} /> {/* Default page */}
                    <Route path="/home" element={<Home />} />
                    <Route path="/battery" element={<Battery />} />
                    <Route path="/network" element={<Network />} />
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
