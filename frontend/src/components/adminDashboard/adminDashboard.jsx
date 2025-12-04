import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
import "./adminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("isAdmin");
    navigate("/");
  }

  // Stats + admin info
  const [stats, setStats] = useState({
    totalFlights: 0,
    totalCarriers: 0,
    totalRevenue: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    totalCustomers: 0,

    // NEW
    adminName: "",
    adminId: "",
  });

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        const res = await fetch("http://localhost:4000/api/dashboard");
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();

        if (!mounted) return;

        setStats({
          totalFlights: data.totalFlights ?? 0,
          totalCarriers: data.totalCarriers ?? 0,
          totalRevenue: data.totalRevenue ?? 0,
          totalBookings: data.totalBookings ?? 0,
          upcomingBookings: data.upcomingBookings ?? 0,
          totalCustomers: data.totalCustomers ?? 0,

          // NEW — pulling admin info
          adminName: data.FullName ?? "",
          adminId: data.AdminId ?? "",
        });
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      }
    }

    loadStats();
    return () => (mounted = false);
  }, []);

  const formatCurrency = (v) =>
    typeof v === "number"
      ? v.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : v;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f3f7fb" }}>
      <AdminNavBar />

      <div style={{ width: "100%", maxWidth: 1000, margin: "28px auto", background: "#fff", padding: 28, borderRadius: 10, boxShadow: "0 8px 30px rgba(9,30,66,0.06)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
          <button
            onClick={handleLogout}
            style={{ background: "#e53e3e", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, fontWeight: 600 }}
          >
            Logout
          </button>
        </div>

        {/* UPDATED TEXT */}
        <p style={{ color: "#475569", marginBottom: 4 }}>
          Welcome, <b>{stats.adminName}</b>
        </p>
        <p style={{ color: "#475569", marginTop: 0 }}>
          Admin ID: <b>{stats.adminId}</b>
        </p>

        {/* Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
            marginTop: 20,
          }}
        >
          <div style={cardStyle}>
            <div style={cardTitleStyle}>TOTAL FLIGHTS</div>
            <div style={cardValueStyle}>{stats.totalFlights}</div>
          </div>

          <div style={cardStyle}>
            <div style={cardTitleStyle}>TOTAL CARRIERS</div>
            <div style={cardValueStyle}>{stats.totalCarriers}</div>
          </div>

          <div style={cardStyle}>
            <div style={cardTitleStyle}>TOTAL REVENUE</div>
            <div style={cardValueStyle}>₹ {formatCurrency(stats.totalRevenue)}</div>
          </div>

          <div style={cardStyle}>
            <div style={cardTitleStyle}>TOTAL BOOKINGS</div>
            <div style={cardValueStyle}>{stats.totalBookings}</div>
          </div>

          <div style={cardStyle}>
            <div style={cardTitleStyle}>UPCOMING BOOKINGS</div>
            <div style={cardValueStyle}>{stats.upcomingBookings}</div>
          </div>

          <div style={cardStyle}>
            <div style={cardTitleStyle}>TOTAL CUSTOMERS</div>
            <div style={cardValueStyle}>{stats.totalCustomers}</div>
          </div>
        </div>

      </div>
    </div>
  );
}

const cardStyle = {
  background: "#f8fafc",
  borderRadius: 10,
  padding: 18,
  boxShadow: "0 6px 18px rgba(9,30,66,0.04)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: 92,
};

const cardTitleStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: "#334155",
  letterSpacing: 0.6,
};

const cardValueStyle = {
  marginTop: 8,
  fontSize: 22,
  fontWeight: 800,
  color: "#0f172a",
};
