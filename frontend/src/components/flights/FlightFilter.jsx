import React, { useState } from "react";

const FlightFilter = ({ airlines = [], onFilter }) => {
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [airline, setAirline] = useState("");

  const apply = () => {
    onFilter({
      minPrice: min === "" ? undefined : Number(min),
      maxPrice: max === "" ? undefined : Number(max),
      airline: airline || undefined,
    });
  };

  const reset = () => {
    setMin("");
    setMax("");
    setAirline("");
    onFilter({});
  };

  return (
    <div style={{ background: "white", padding: 12, borderRadius: 8 }}>
      <h4 style={{ marginTop: 0 }}>Filters</h4>

      <div style={{ display: "grid", gap: 8 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6 }}>Airline</label>
          <select value={airline} onChange={(e) => setAirline(e.target.value)} style={{ width: "100%", padding: 8 }}>
            <option value="">Any</option>
            {airlines.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" placeholder="Min price" value={min} onChange={e => setMin(e.target.value)} style={{ flex: 1, padding: 8 }} />
          <input type="number" placeholder="Max price" value={max} onChange={e => setMax(e.target.value)} style={{ flex: 1, padding: 8 }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={apply} style={{ padding: "8px 12px", background: "#0A3D62", color: "white", border: "none", borderRadius: 6 }}>Apply</button>
          <button onClick={reset} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 6 }}>Reset</button>
        </div>
      </div>
    </div>
  );
};

export default FlightFilter;