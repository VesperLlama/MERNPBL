import React from "react";

const AirportSelect = ({ label, value, onChange, airports = [] }) => {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          background: "white",
        }}
      >
        <option value="">Select Airport</option>
        {airports.map((a) => (
          <option key={a.code} value={a.code}>
            {a.city} ({a.code})
          </option>
        ))}
      </select>
    </div>
  );
};

export default AirportSelect;