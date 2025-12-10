import React from "react";
import { useNavigate } from "react-router-dom";
import "./customerNavbar.css";

export default function CustomerNavbar() {
  const navigate = useNavigate();

  const fullName = JSON.parse(localStorage.getItem("user")).name || "Customer";

  function handleLogout() {
    localStorage.clear();
    navigate("/");
  }

  return (
    <nav className="customer-navbar">
      {/* LEFT SECTION */}
      <div className="nav-left">
        <div className="brand"> <p style={{ color: "black", display: "inline" }}>Go</p> Voyage</div>
      </div>

      {/* CENTER NAVIGATION BUTTONS */}
      <ul className="nav-center">
        <li className="nav-item center">
          <button className="nav-link" onClick={() => navigate("/customer/searchflight")}>
             <p style={{ color: "black", display: "inline" }}>Search</p> Flights
          </button>
        </li>

        <li className="nav-item">
          <button className="nav-link" onClick={() => navigate("/customer/allBookings")}>
            <p style={{ color: "black", display: "inline" }}>View</p> Bookings
          </button>
        </li>

        <li className="nav-item">
          <button className="nav-link" onClick={() => navigate("/customer/policies")}>
            Policy
          </button>
        </li>

        

        <li className="nav-item">
          <button className="nav-link" onClick={() => navigate("/customer/profile")}>
            <p style={{"color":"black"}}>Profile</p>
          </button>
        </li>
      </ul>

      {/* RIGHT SIDE */}
      <div className="nav-right">
        <div className="welcome-msg"><p  onClick={() => navigate("/dashboard")} 
        style={{ color: "#f09537", display: "inline", "background":"rgb(255, 248, 235)", "padding":"10px", "borderRadius": "20px" }}>
          {fullName}</p></div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}