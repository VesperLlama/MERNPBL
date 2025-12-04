import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./adminNavBar.css";

export default function AdminNavBar() {
  const [openMenu, setOpenMenu] = useState(null); // 'carrier' | 'flights' | 'update' | null
  const navigate = useNavigate();
  const rootRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function handleLogout() {
    localStorage.clear();
    navigate("/");
  }

  return (
    <nav className="admin-navbar" ref={rootRef}>
      <div className="nav-left" onClick={() => navigate("/admin") }>
        <div className="brand">Next<p style={{ color: "blue", display: "inline" }}>Trip</p></div>
      </div>

      <ul className="nav-center">
        <li className="nav-item dropdown">
          <button
            className="nav-link"
            onClick={() => navigate("/admin")}
          >
            Dashboard
          </button>
        </li>

        <li className="nav-item dropdown">
          <button
            className="nav-link"
            onClick={() => setOpenMenu(openMenu === "carrier" ? null : "carrier")}
          >
            Carrier
          </button>
          <div className={`dropdown-menu ${openMenu === "carrier" ? "show" : ""}`}>
            <button className="dropdown-btn" onClick={() => navigate("/admin/carriers/register")}>Register New</button>
            <button className="dropdown-btn" onClick={() => navigate("/admin/carriers")}>View Carriers</button>
          </div>
        </li>

        <li className="nav-item dropdown">
          <button
            className="nav-link"
            onClick={() => setOpenMenu(openMenu === "flights" ? null : "flights")}
          >
            Flights
          </button>
          <div className={`dropdown-menu ${openMenu === "flights" ? "show" : ""}`}>
            <button className="dropdown-btn" onClick={() => navigate("/admin/flights/register")}>Register New</button>
            <button className="dropdown-btn" onClick={() => navigate("/admin/flights")}>View Flights</button>
          </div>
        </li>

        <li className="nav-item dropdown">
          <button
            className="nav-link"
            onClick={() => setOpenMenu(openMenu === "update" ? null : "update")}
          >
            Update
          </button>
          <div className={`dropdown-menu ${openMenu === "update" ? "show" : ""}`}>
            <button className="dropdown-btn" onClick={() => navigate("/admin/flights/update")}>Flight</button>
            <button className="dropdown-btn" onClick={() => navigate("/admin/carriers/update")}>Carrier</button>
          </div>
        </li>
      </ul>

      <div className="nav-right">
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
