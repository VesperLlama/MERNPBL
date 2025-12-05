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
      const res = await fetch(`http://localhost:4000/api/flights/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        // If backend returns { flight: {...} } or { data: { flight } }
        const f =
          data && (data.flight || data.data?.flight)
            ? data.flight || data.data.flight
            : data;
        setFlight(f);
      } else if (res.status === 404) {
        // fallback: fetch all and find
        const allRes = await fetch("http://localhost:4000/api/flights/all", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const all = await allRes.json();
        const list = Array.isArray(all) ? all : all.flights || all.data || [];
        const found = list.find((x) => {
          return ["_id", "flightId", "id"].some(
            (k) => String(x[k]) === String(id)
          );
        });
        if (found) setFlight(found);
        else setError("Flight not found");
      } else {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Fetch failed (${res.status})`);
      }
    } catch (e) {
      console.error("fetchDetail error:", e);
      setError(e.message || "Failed to load flight details");
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div className="vf-root">
        <AdminNavBar />
        <div className="vf-container">Loading flight...</div>
      </div>
    );

  const isPlainObject = (val) =>
    val !== null &&
    typeof val === "object" &&
    !Array.isArray(val) &&
    !(val instanceof Date);

  const renderValue = (val) => {
    if (val === null || val === undefined) return "";

    if (val instanceof Date) return val.toISOString();

    if (typeof val !== "object") return String(val);

    if (Array.isArray(val)) {
      if (val.every((item) => item === null || typeof item !== "object")) {
        return (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {val.map((item, idx) => (
              <li key={idx}>{renderValue(item)}</li>
            ))}
          </ul>
        );
      }
      return (
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {val.map((item, idx) => (
            <li key={idx}>{renderValue(item)}</li>
          ))}
        </ul>
      );
    }

    if (isPlainObject(val)) {
      const entries = Object.entries(val);
      if (entries.length === 0) return "{}";

      return (
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {entries.map(([k, v]) => (
            <li key={k}>
              {prettyKey(k)}: {renderValue(v)}
            </li>
          ))}
        </ul>
      );
    }
  };

  return (
    <div className="vf-root">
      <AdminNavBar />
      <div className="vf-container">
        <button className="vf-back" onClick={() => navigate(-1)}>
          Back
        </button>
        <h2>Flight Details</h2>
        {error && <div className="vf-empty">{error}</div>}
        {!error && !flight && (
          <div className="vf-empty">No details available.</div>
        )}
        {!error && flight && (
          <div className="vf-table-wrap">
            <table className="vf-table">
              <tbody>
                {Object.keys(flight).map((k) => (
                  <tr key={k}>
                    <th style={{ width: 220 }}>{prettyKey(k)}</th>
                    <td>{renderValue(flight[k])}</td>
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
