import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav style={{
      width: "100%",
      padding: "12px 20px",
      background: "#0A3D62",
      color: "white",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <h2 style={{ margin: 0 }}>✈️ Airline</h2>

      <div style={{ display: "flex", gap: "20px" }}>
        <Link to="/" style={{ color: "white", textDecoration: "none" }}>Home</Link>
        <Link to="/search" style={{ color: "white", textDecoration: "none" }}>Search Flights</Link>
        <Link to="/login" style={{ color: "white", textDecoration: "none" }}>Login</Link>
      </div>
    </nav>
  );
};

export default Navbar;