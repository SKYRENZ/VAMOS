import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Battery from './pages/Battery';
import Network from './pages/Network';
import BottomNav from './components/BottomNav';

const App = () => {
    return (
        <Router>
            <div className="flex flex-col min-h-screen">
                {/* Page Content */}
                <div className="flex-grow">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/battery" element={<Battery />} />
                        <Route path="/network" element={<Network />} />
                    </Routes>
                </div>
                
                {/* Fixed Bottom Navigation */}
                <BottomNav />
            </div>
        </Router>
    );
};

export default App;
