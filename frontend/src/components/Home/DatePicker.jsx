import React from "react";

const DatePicker = ({ value, onChange }) => {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>
        Journey Date
      </label>

      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          background: "white",
        }}
      />
    </div>
  );
};

export default DatePicker;