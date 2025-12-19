// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
// import "./adminDashboard.css";

// export default function AdminDashboard() {
//   const navigate = useNavigate();

//   function handleLogout() {
//     localStorage.removeItem("isAdmin");
//     navigate("/");
//   }

//   // Stats + admin info
//   const [stats, setStats] = useState({
//     totalFlights: 0,
//     totalCarriers: 0,
//     totalRevenue: 0,
//     totalBookings: 0,
//     upcomingBookings: 0,
//     totalCustomers: 0,

//     // NEW
//     adminName: "",
//     adminId: "",
//   });

//   useEffect(() => {
//     let mounted = true;

//     async function loadStats() {
//       try {
//         // Try to get admin info from localStorage (login stores `user`) and token
//         const storedUser = (() => {
//           try {
//             return JSON.parse(localStorage.getItem('user') || 'null');
//           } catch (e) {
//             return null;
//           }
//         })();

//         const token = localStorage.getItem('token') || (storedUser && storedUser.token) || '';
//         const headers = token ? { Authorization: `Bearer ${token}` } : {};

//         const res = await fetch("http://localhost:4000/api/admins/dashboard", { headers });
//         if (!res.ok) {
//           // try to read body for debugging
//           let body = null;
//           try { body = await res.json(); } catch (e) { /* ignore */ }
//           throw new Error("Network response was not ok" + (body ? ` - ${JSON.stringify(body)}` : ''));
//         }

//         const data = await res.json();
//         // API returns { data: { ... } }
//         const payload = data && data.data ? data.data : {};
//         console.log(payload);

//         if (!mounted) return;

//         setStats({
//           totalFlights: payload.totalFlights ?? 0,
//           totalCarriers: payload.totalCarriers ?? 0,
//           totalRevenue: payload.totalRevenue ?? 0,
//           totalBookings: payload.totalBookings ?? 0,
//           upcomingBookings: payload.upcomingBookings ?? 0,
//           totalCustomers: payload.totalCustomers ?? 0,

//           // Prefer server-provided admin info, fallback to stored user
//           adminName: storedUser?.name || '',
//           adminId: storedUser?.id || '',
//         });
//       } catch (err) {
//         console.error("Failed to load admin stats:", err);
//       }
//     }

//     loadStats();
//     return () => (mounted = false);
//   }, []);

//   const formatCurrency = (v) =>
//     typeof v === "number"
//       ? v.toLocaleString(undefined, { maximumFractionDigits: 2 })
//       : v;

//   return (
//     <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#5da399" }}>
//       <AdminNavBar />

//       <div style={{ width: "100%", maxWidth: 1000, margin: "28px auto", background: "#fff", padding: 28, borderRadius: 10, boxShadow: "0 8px 30px rgba(9,30,66,0.06)" }}>

//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
//           <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
//           {/* <button
//             onClick={handleLogout}
//             style={{ background: "#e53e3e", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, fontWeight: 600 }}
//           >
//             Logout
//           </button> */}
//         </div>

//         {/* UPDATED TEXT */}
//         <p style={{ color: "#475569", marginBottom: 4 }}>
//           Welcome,&nbsp;<b style={{"color":"#397367", fontSize: "1.5rem", fontFamily:"Lato"}}>{stats.adminName.toLocaleUpperCase()}</b>
//         </p>
//         {/* <p style={{ color: "#475569", marginTop: 0 }}>
//           Admin ID: <b>{stats.adminId}</b>
//         </p> */}

//         {/* Cards Grid */}
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(2, 1fr)",
//             gap: 16,
//             marginTop: 20,
//           }}
//         >
//           <div style={{cardStyle, "background":"rgb(213, 244,240)", "borderRadius":"15px 15px 15px 15px", "padding": "20px"}}>
//             <div style={cardTitleStyle}>TOTAL FLIGHTS</div>
//             <div style={cardValueStyle}>{stats.totalFlights}</div>
//           </div>

//           <div style={{cardStyle, "background":"rgb(213, 244,240)", "borderRadius":"15px 15px 15px 15px", "padding": "20px"}}>
//             <div style={cardTitleStyle}>TOTAL CARRIERS</div>
//             <div style={cardValueStyle}>{stats.totalCarriers}</div>
//           </div>

//           <div style={{cardStyle, "background":"rgb(213, 244,240)", "borderRadius":"15px 15px 15px 15px", "padding": "20px"}}>
//             <div style={cardTitleStyle}>TOTAL REVENUE</div>
//             <div style={cardValueStyle}>₹ {formatCurrency(stats.totalRevenue)}</div>
//           </div>

//           <div style={{cardStyle, "background":"rgb(213, 244,240)", "borderRadius":"15px 15px 15px 15px", "padding": "20px"}}>
//             <div style={cardTitleStyle}>TOTAL BOOKINGS</div>
//             <div style={cardValueStyle}>{stats.totalBookings}</div>
//           </div>

//           <div style={{cardStyle, "background":"rgb(213, 244,240)", "borderRadius":"15px 15px 15px 15px", "padding": "20px"}}>
//             <div style={cardTitleStyle}>UPCOMING BOOKINGS</div>
//             <div style={cardValueStyle}>{stats.upcomingBookings}</div>
//           </div>

//           <div style={{cardStyle, "background":"rgb(213, 244,240)", "borderRadius":"15px 15px 15px 15px", "padding": "20px"}}>
//             <div style={cardTitleStyle}>TOTAL CUSTOMERS</div>
//             <div style={cardValueStyle}>{stats.totalCustomers}</div>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// }

// const cardStyle = {
//   background: "#f8fafc",
//   borderRadius: 10,
//   padding: 18,
//   boxShadow: "0 6px 18px rgba(9,30,66,0.04)",
//   display: "flex",
//   flexDirection: "column",
//   justifyContent: "space-between",
//   minHeight: 92,
// };

// const cardTitleStyle = {
//   fontSize: 13,
//   fontWeight: 700,
//   color: "#334155",
//   letterSpacing: 0.6,
// };

// const cardValueStyle = {
//   marginTop: 8,
//   fontSize: 22,
//   fontWeight: 800,
//   color: "#0f172a",
// };







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


