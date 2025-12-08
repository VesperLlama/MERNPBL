import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
import Popup from "../pop-up/pop-up.jsx";
import "./viewFlights.css";

export default function ViewFlights() {
  const [flights, setFlights] = useState([]);
  const [filter, setFilter] = useState("All");
  const [originFilter, setOriginFilter] = useState("All");
  const [destFilter, setDestFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [searchId, setSearchId] = useState("");
  const [searchError, setSearchError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const [popupType, setPopupType] = useState("success");
  const [popupDuration, setPopupDuration] = useState(3500);

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

  async function resetFilter() {
    setFilter("All");
    setOriginFilter("All");
    setDestFilter("All");
    setDateFilter("");
    setSearchId("");
    fetchFlights();
  }

  const carriers = Array.from(new Set(flights.map((f) => f.carrierName || f.CarrierName).filter(Boolean))).sort();

  const origins = Array.from(new Set(flights.map((f) => getField(f, ["source", "Origin"]) ).filter(Boolean))).sort();
  const destinations = Array.from(new Set(flights.map((f) => getField(f, ["destination", "Destination"]) ).filter(Boolean))).sort();

  function getField(f, keys) {
    for (const k of keys) {
      if (f[k] !== undefined && f[k] !== null) return f[k];
    }
    return "";
  }

  const navigate = useNavigate();

  function matchesDate(f) {
    if (!dateFilter) return true;
    const raw = getField(f, ["departureTime", "departure", "Departure"]);
    if (!raw) return false;
    const d = new Date(String(raw).replace(' ', 'T'));
    if (isNaN(d.getTime())) return false;
    const sel = new Date(dateFilter);
    return d.getFullYear() === sel.getFullYear() && d.getMonth() === sel.getMonth() && d.getDate() === sel.getDate();
  }

  async function handleCancel(flightNumber) {
    const res = await fetch(`http://localhost:4000/api/bookings/admin-cancel-flight/${flightNumber}`, {
      "method": "PUT",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.message || `Status ${res.status}`;
      showAlert(`Failed to cancel flight. ${msg}`, "error");
      return;
    }
    showAlert("Flight Cancelled Successfully!", "success");
    fetchFlights();
  }

  function navigateToDetails(id){
    navigate(`/admin/flights/${id}`);
  }
    

  function handleTrOrButtonClick(event, id) {
    console.log(id);
    if (event.target.matches('button[class="vb-cancel"]')) {
      handleCancel(id);
    } else {
      navigateToDetails(id);
    }
  }

  function showAlert(msg, type = "success", ms = 3500) {
    setPopupMsg(msg);
    setPopupType(type === "error" ? "error" : "success");
    setPopupDuration(ms);
    setPopupOpen(true);
  }

  const displayed = flights.filter((f) => {
    const carrierMatch = filter === "All" || (f.carrierName || f.CarrierName) === filter;
    const originMatch = originFilter === "All" || String(getField(f, ["source", "Origin"])) === originFilter;
    const destMatch = destFilter === "All" || String(getField(f, ["destination", "Destination"])) === destFilter;
    const dateMatch = matchesDate(f);
    return carrierMatch && originMatch && destMatch && dateMatch;
  });

  return (
    <div className="vf-root">
      <AdminNavBar />
      <Popup open={popupOpen} message={popupMsg} type={popupType} duration={popupDuration} onClose={() => setPopupOpen(false)} />
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

          <label className="vf-filter">
            Origin:
            <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)}>
              <option value="All">All</option>
              {origins.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="vf-filter">
            Destination:
            <select value={destFilter} onChange={(e) => setDestFilter(e.target.value)}>
              <option value="All">All</option>
              {destinations.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>

          <label className="vf-filter">
            Date:
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Flight ID:
            <input placeholder="search by id" value={searchId} onChange={(e) => { setSearchId(e.target.value); setSearchError(""); }} />
            <button type="button" onClick={() => {
              const q = (searchId || "").trim();
              if (!q) return setSearchError('Enter flight ID to search');
              const found = flights.find(x => {
                const id = getField(x, ["_id", "flightNumber", "id", "flightId"]);
                return String(id) === q;
              });
              if (found) {
                const id = getField(found, ["_id", "flightNumber", "id", "flightId"]);
                navigate(`/admin/flights/${id}`);
              } else {
                setSearchError(`Flight with ID "${q}" not found.`);
              }
            }}>
              Go
            </button>
          </label>
          <button className="vf-refresh" onClick={resetFilter} disabled={loading}>
            {loading ? "Loading..." : "Reset"}
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 && (
                  <tr>
                    <td className="vf-empty" colSpan={8}>
                      {loading ? "Loading flights..." : "No flights found."}
                      {searchError && (
                        <div style={{ color: 'darkred', marginTop: 8 }}>{searchError}</div>
                      )}
                    </td>
                  </tr>
                )}
                {displayed.map((f, idx) => {
                  const id = getField(f, ["_id", "flightNumber", "id"]);
                  const isCancelled = Boolean(f.cancelled || String(f.FlightStatus).toLowerCase() !== "active");
                  const isCancelling = Boolean(f.cancelling);
                  return (
                    <tr
                      key={id || idx}
                      className="vf-row"
                      tabIndex={0}
                      onClick={() => handleTrOrButtonClick(event, id)}
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
                      <td>
                        <button
                          className="vb-cancel"
                          disabled={isCancelled || isCancelling}
                          title={isCancelled ? "Already cancelled" : "Cancel booking"}
                        >
                          {isCancelling ? "Cancelling..." : isCancelled ? "Cancelled" : "Cancel"}
                        </button>
                      </td>
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
