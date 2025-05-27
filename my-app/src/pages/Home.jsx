// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { FaUserPlus } from "react-icons/fa";
import "./Home.css";
import { FaSignInAlt } from "react-icons/fa";

export default function Home() {
  return (
    <div className="home-container">
      <div className="home-bg" />
      <div className="home-overlay" />

      <div className="home-content">
        <div className="home-card">
          <h1 className="home-title">
            Bine ai venit pe <span className="highlight">ROVENTURA</span>!
          </h1>
          <p className="home-text">
            Descopera cele mai frumoase destinatii si recomandari de
            din ROMANIA. Cel mai iubit FORUM de vacante al romanilor!
          </p>
          <div className="home-buttons">
            <Link to="/login" className="home-button login">
              <FaSignInAlt /> Intra în cont
            </Link>
            <Link to="/signup" className="home-button signup">
              <FaUserPlus /> Inregistreaza-te
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
