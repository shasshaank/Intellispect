// src/components/PublicNavbar.js
import { Link } from 'react-router-dom';
import './navbarpub.css';

const PublicNavbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">IntelliInspect</div>

      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/support">Support</Link></li>
        <li><Link to="/login" className="get-started">Get Started</Link></li>
      </ul>
    </nav>
  );
};

export default PublicNavbar;
