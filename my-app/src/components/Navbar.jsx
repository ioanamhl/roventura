import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <h1 className="navbar-title">ROVENTURA</h1>
      <div className="navbar-links">
        {user ? (
          <>
            <span>Salut, {user.username}!</span>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Înregistrare</Link>
          </>
        )}
      </div>
    </nav>
  );
}
