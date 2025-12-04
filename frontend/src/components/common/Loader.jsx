import React from "react";

const Loader = () => {
  return (
    <div style={{
      display: "flex",
      height: "80vh",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        border: "4px solid #eee",
        borderTop: "4px solid #0A3D62",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        animation: "spin 1s linear infinite"
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;