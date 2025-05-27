// src/pages/Forum.jsx
import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import "./Forum.css";

export default function Forum({ user, setUser }) {
  return (
    <div className="forum-root">
      <div className="forum-bg" />
      <div className="forum-overlay" />

      <Navbar user={user} setUser={setUser} />

      <div className="forum-layout">
        <Sidebar />
        <main className="forum-main">
          <h1 className="forum-title">Impartaseste-ti experienta!</h1>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
