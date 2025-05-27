// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaSignInAlt, FaUserPlus, FaHome } from "react-icons/fa";
import "./Login.css";

export default function Login({ setUser }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
});
      const data = await res.json();
      console.log("Login response:", data);

      if (res.ok) {
                const userObj = data.user || {
          id: null,
          username: email.split("@")[0],
          email
        };

        localStorage.setItem("token", data.token);
        localStorage.setItem("username", userObj.username);

        setUser(userObj);

        navigate("/forum");
      } else {
        alert(data.error || "Autentificare eșuată");
      }
    } catch (err) {
      console.error(err);
      alert("Eroare la conectare");
    }
  };

  return (
    <div className="login-container">
      <div className="login-bg" />
      <Link to="/" className="home-button-login"><FaHome /> Acasa</Link>

      <div className="login-overlay" />
      <div className="login-content">
        <form onSubmit={handleSubmit} className="login-card">
          <h2 className="login-title"><FaSignInAlt /> Autentificare</h2>
          <input
            type="email" placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)}
            required className="login-input"
          />
          <input
            type="password" placeholder="Parolă"
            value={password} onChange={e => setPassword(e.target.value)}
            required className="login-input"
          />
          <button type="submit" className="login-button">Intră în cont</button>
          <p className="login-link">
            Nu ai cont? <Link to="/signup"><FaUserPlus /> Înregistrează-te</Link>
          </p>
        </form>
      </div>
    </div>
  );
}