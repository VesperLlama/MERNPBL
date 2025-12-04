import React from "react";
import { useNavigate } from "react-router-dom";
import "./customerNavbar.css";

export default function CustomerNavbar() {
  const navigate = useNavigate();

  const fullName = JSON.parse(localStorage.getItem("user")).name.toUpperCase() || "Customer";

  function handleLogout() {
    localStorage.clear();
    navigate("/");
  }

  return (
    <nav className="customer-navbar">
      {/* LEFT SECTION */}
      <div className="nav-left" onClick={() => navigate("/dashboard")}>
        <div className="brand">Next<p style={{ color: "blue", display: "inline" }}>Trip</p></div>
      </div>

      {/* CENTER NAVIGATION BUTTONS */}
      <ul className="nav-center">
        <li className="nav-item center">
          <button className="nav-link" onClick={() => navigate("/customer/searchflight")}>
            Search Flights
          </button>
        </li>

        <li className="nav-item">
          <button className="nav-link" onClick={() => navigate("/customer/allBookings")}>
            View Bookings
          </button>
        </li>

        <li className="nav-item">
          <button className="nav-link" onClick={() => navigate("/customer/cancelBooking")}>
            Cancel Booking
          </button>
        </li>

        

        <li className="nav-item">
          <button className="nav-link" onClick={() => navigate("/customer/profile")}>
            Profile
          </button>
        </li>
      </ul>

      {/* RIGHT SIDE */}
      <div className="nav-right">
        <div className="welcome-msg"><p style={{ color: "skyblue", display: "inline" }}>{fullName}</p>&nbsp;&nbsp;</div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}