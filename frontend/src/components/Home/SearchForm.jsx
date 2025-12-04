import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AirportSelect from "./AirportSelect";
import DatePicker from "./DatePicker";
import Button from "../common/Button";

/**
 * Small in-file airports list for demo. Replace with dynamic fetch from backend or utils/airports.js
 */
const defaultAirports = [
  { code: "DEL", city: "New Delhi" },
  { code: "BOM", city: "Mumbai" },
  { code: "BLR", city: "Bengaluru" },
  { code: "MAA", city: "Chennai" },
  { code: "HYD", city: "Hyderabad" },
];

const SearchForm = ({ airports = defaultAirports }) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e && e.preventDefault();

    if (!from || !to || !date) {
      alert("Please select origin, destination and date.");
      return;
    }
    // navigate to /search with query params
    const params = new URLSearchParams({ from, to, date }).toString();
    navigate(`/search?${params}`);
  };

  const swap = () => {
    setFrom((prevFrom) => {
      setTo(prevFrom);
      return to;
    });
  };

  return (
    <form
      onSubmit={handleSearch}
      style={{
        width: 520,
        padding: 20,
        borderRadius: 10,
        background: "white",
        boxShadow: "0 4px 18px rgba(10,61,98,0.06)",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 12, textAlign: "center" }}>Search Flights</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <AirportSelect label="From" value={from} onChange={setFrom} airports={airports} />
        <AirportSelect label="To" value={to} onChange={setTo} airports={airports} />
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 6, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <DatePicker value={date} onChange={setDate} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            type="button"
            onClick={swap}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
            title="Swap from/to"
          >
            Swap
          </button>

          <Button title="Search" onClick={handleSearch} style={{ width: 120 }} />
        </div>
      </div>
    </form>
  );
};

export default SearchForm;