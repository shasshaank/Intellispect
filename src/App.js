import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Support from './pages/Support';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Signup from './pages/Signup';
import Predict from './pages/Predict';

// Navbars
import PublicNavbar from './components/PublicNavbar';
import PrivateNavbar from './components/PrivateNavbar';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn);
  }, [isLoggedIn]);

  return (
    <Router>
      <AppContent isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
    </Router>
  );
}

function AppContent({ isLoggedIn, setIsLoggedIn }) {
  const location = useLocation();

  const privateRoutes = ['/dashboard', '/reports', '/predict'];
  const isPrivateRoute = privateRoutes.includes(location.pathname);

  return (
    <>
      {isPrivateRoute ? (
        isLoggedIn ? (
          <PrivateNavbar setIsLoggedIn={setIsLoggedIn} />
        ) : null
      ) : (
        <PublicNavbar />
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/support" element={<Support />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/signup" element={<Signup setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/predict" element={<Predict />} />
      </Routes>
    </>
  );
}

export default App;
