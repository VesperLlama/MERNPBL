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

  const [stats, setStats] = useState({
    totalFlights: 0,
    totalCarriers: 0,
    totalRevenue: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    totalCustomers: 0,
    adminName: "",
    adminId: "",
  });

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        const storedUser = (() => {
          try {
            return JSON.parse(localStorage.getItem("user") || "null");
          } catch {
            return null;
          }
        })();

        const token =
          localStorage.getItem("token") ||
          (storedUser && storedUser.token) ||
          "";

        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const res = await fetch(
          "http://localhost:4000/api/admins/dashboard",
          { headers }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch dashboard stats");
        }

        const data = await res.json();
        const payload = data?.data || {};

        if (!mounted) return;

        setStats({
          totalFlights: payload.totalFlights ?? 0,
          totalCarriers: payload.totalCarriers ?? 0,
          totalRevenue: payload.totalRevenue ?? 0,
          totalBookings: payload.totalBookings ?? 0,
          upcomingBookings: payload.upcomingBookings ?? 0,
          totalCustomers: payload.totalCustomers ?? 0,
          adminName: storedUser?.name || "",
          adminId: storedUser?.id || "",
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
    <div className="admin-dashboard-page">
      <AdminNavBar />

      <div className="admin-dashboard-container">
        <div className="admin-dashboard-header">
          <h2>Admin Dashboard</h2>

          {/* Uncomment if logout needed */}
          {/* 
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button> 
          */}
        </div>

        <p className="admin-welcome">
          Welcome,&nbsp;
          <span className="admin-name">
            {stats.adminName.toUpperCase()}
          </span>
        </p>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-card-title">TOTAL FLIGHTS</div>
            <div className="dashboard-card-value">{stats.totalFlights}</div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-title">TOTAL CARRIERS</div>
            <div className="dashboard-card-value">{stats.totalCarriers}</div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-title">TOTAL REVENUE</div>
            <div className="dashboard-card-value">
              ₹ {formatCurrency(stats.totalRevenue)}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-title">TOTAL BOOKINGS</div>
            <div className="dashboard-card-value">{stats.totalBookings}</div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-title">UPCOMING BOOKINGS</div>
            <div className="dashboard-card-value">
              {stats.upcomingBookings}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-title">TOTAL CUSTOMERS</div>
            <div className="dashboard-card-value">
              {stats.totalCustomers}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


