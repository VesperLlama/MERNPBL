import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
import "./viewFlights.css";

function prettyKey(k) {
  // Simple prettify: camelCase or PascalCase to words
  return k
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export default function ViewFlightDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  async function fetchDetail() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/flights/${id}`);
      if (res.ok) {
        const data = await res.json();
        // If backend returns { flight: {...} }
        const f = data && data.flight ? data.flight : data;
        setFlight(f);
      } else if (res.status === 404) {
        // fallback: fetch all and find
        const all = await (await fetch("/api/flights")).json();
        const list = Array.isArray(all) ? all : all.flights || [];
        const found = list.find((x) => {
          return ["_id", "flightId", "id"].some((k) => String(x[k]) === String(id));
        });
        if (found) setFlight(found);
        else setError("Flight not found");
      } else {
        throw new Error("Fetch failed");
      }
    } catch (e) {
      setError("Failed to load flight details");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="vf-root"><AdminNavBar /><div className="vf-container">Loading flight...</div></div>
  );

  return (
    <div className="vf-root">
      <AdminNavBar />
      <div className="vf-container">
        <button className="vf-back" onClick={() => navigate(-1)}>Back</button>
        <h2>Flight Details</h2>
        {error && <div className="vf-empty">{error}</div>}
        {!error && !flight && <div className="vf-empty">No details available.</div>}
        {!error && flight && (
          <div className="vf-table-wrap">
            <table className="vf-table">
              <tbody>
                {Object.keys(flight).map((k) => (
                  <tr key={k}>
                    <th style={{ width: 220 }}>{prettyKey(k)}</th>
                    <td>{String(flight[k] === null || flight[k] === undefined ? "" : flight[k])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
