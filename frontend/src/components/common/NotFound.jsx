import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h1 style={{ fontSize: "60px", marginBottom: "0" }}>404</h1>
      <p style={{ fontSize: "20px" }}>Page Not Found</p>

      <Link to="/" style={{ color: "#0A3D62", textDecoration: "underline", fontWeight: 600 }}>
        Go to Home
      </Link>
    </div>
  );
};

export default NotFound;