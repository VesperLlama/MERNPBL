import React from "react";

const Button = ({ title, onClick, style = {} }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 18px",
        background: "#0A3D62",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: 600,
        ...style
      }}
    >
      {title}
    </button>
  );
};

export default Button;