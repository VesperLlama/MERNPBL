import React from "react";
import { useNavigate } from "react-router-dom";
import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
import "./adminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();

  function handleLogout() {
    // clear admin flag and go home
    localStorage.removeItem("isAdmin");
    navigate("/");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f3f7fb" }}>
      <AdminNavBar />
      <div style={{ width: "100%", maxWidth: 1000, margin: "28px auto", background: "#fff", padding: 28, borderRadius: 10, boxShadow: "0 8px 30px rgba(9,30,66,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
          <div>
            <button onClick={handleLogout} style={{ background: "#e53e3e", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, fontWeight: 600 }}>Logout</button>
          </div>
        </div>

        <p style={{ color: "#475569" }}>Welcome, admin — this is a placeholder dashboard. Add admin controls here.</p>

      </div>
    </div>
  );
}
