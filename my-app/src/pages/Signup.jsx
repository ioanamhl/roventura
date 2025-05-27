import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaUserPlus, FaSignInAlt, FaHome } from "react-icons/fa";
import "./Signup.css";

function Signup({ setUser  }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        setUser(data.user);

        navigate("/forum");
      } else {
        alert(data.error || "Înregistrare eșuată");
      }
    } catch (error) {
      console.error("Eroare:", error);
      alert("Eroare la conectare");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-bg" />
      <Link to="/" className="home-button-signup"><FaHome /> Acasa</Link>
      <div className="signup-overlay" />
      
      <div className="signup-content">
        <form onSubmit={handleSubmit} className="signup-card">
          <h2 className="signup-title">
            <FaUserPlus /> Creează un cont
          </h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="signup-input"
          />
          <input
            type="password"
            placeholder="Parolă"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="signup-input"
          />
          <button type="submit" className="signup-button">
            Înregistrează-te
          </button>
          <p className="signup-link">
            Ai deja cont? <Link to="/login"><FaSignInAlt /> Intră în cont</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;
