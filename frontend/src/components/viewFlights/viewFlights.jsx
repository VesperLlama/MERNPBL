import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
import "./viewFlights.css";

export default function ViewFlights() {
  const [flights, setFlights] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFlights();
  }, []);

  async function fetchFlights() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:4000/api/flights/all", {
        method: "GET",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // Accept either an array or an object with flights property
      const list = Array.isArray(data) ? data : data.flights || [];
      setFlights(list);
    } catch (e) {
      setError("Failed to load flights");
    } finally {
      setLoading(false);
    }
  }

  const carriers = Array.from(new Set(flights.map((f) => f.carrierName || f.CarrierName).filter(Boolean))).sort();

  function getField(f, keys) {
    for (const k of keys) {
      if (f[k] !== undefined && f[k] !== null) return f[k];
    }
    return "";
  }

  const navigate = useNavigate();

  const displayed = flights.filter((f) => filter === "All" || (f.carrierName || f.CarrierName) === filter);

  return (
    <div className="vf-root">
      <AdminNavBar />
      <div className="vf-container">
        <h2>Flights</h2>

        <div className="vf-controls">
          <label className="vf-filter">
            Carrier:
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="All">All</option>
              {carriers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <button className="vf-refresh" onClick={fetchFlights} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error && <div className="vf-empty">{error}</div>}

        {!error && (
          <div className="vf-table-wrap">
            <table className="vf-table">
              <thead>
                <tr>
                  <th>Flight ID</th>
                  <th>Carrier Name</th>
                  <th>Origin</th>
                  <th>Destination</th>
                  <th>Air Fare</th>
                  <th>Seats (Economy)</th>
                  <th>Seats (Business)</th>
                  <th>Seats (Executive)</th>
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 && (
                  <tr>
                    <td className="vf-empty" colSpan={8}>
                      {loading ? "Loading flights..." : "No flights found."}
                    </td>
                  </tr>
                )}
                {displayed.map((f, idx) => {
                  const id = getField(f, ["_id", "flightNumber", "id"]);
                  return (
                    <tr
                      key={id || idx}
                      className="vf-row"
                      tabIndex={0}
                      onClick={() => id && navigate(`/admin/flights/${id}`)}
                      onKeyDown={(e) => (e.key === "Enter" && id && navigate(`/admin/flights/${id}`))}
                    >
                      <td>{id}</td>
                      <td>{getField(f, ["carrierName", "CarrierName", "carrier"])}</td>
                      <td>{getField(f, ["source", "Origin"])}</td>
                      <td>{getField(f, ["destination", "Destination"])}</td>
                      <td>{getField(f, ["airFare", "airfare", "fare", "price"])}</td>
                      <td>{getField(f.seats, ["economy"])}</td>
                      <td>{getField(f.seats, ["business"])}</td>
                      <td>{getField(f.seats, ["executive"])}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
