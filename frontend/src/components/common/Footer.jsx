import React from "react";

const Footer = () => {
  return (
    <footer style={{
      width: "100%",
      background: "#0A3D62",
      color: "white",
      padding: "20px",
      textAlign: "center",
      marginTop: "40px"
    }}>
      <p style={{ margin: 0 }}>© {new Date().getFullYear()} Airline Management System</p>
      <p style={{ margin: 0 }}>All Rights Reserved</p>
    </footer>
  );
};

export default Footer;