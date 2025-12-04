import React from "react";

const FlightSort = ({ onSort }) => {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <label style={{ fontWeight: 600 }}>Sort:</label>
      <select onChange={(e) => onSort(e.target.value)} style={{ padding: 8 }}>
        <option value="">Recommended</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="dep_earliest">Earliest Departure</option>
      </select>
    </div>
  );
};

export default FlightSort;