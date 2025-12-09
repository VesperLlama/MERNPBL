import React, { useState, useRef, useEffect } from "react";
import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
import "./updateFlight.css";
import Popup from "../pop-up/pop-up.jsx";

const carrierOptions = [];
  const places = [
    "DEL (Delhi)",
    "BOM (Mumbai)",
    "VNS (Varanasi)",
    "LKO (Lucknow)",
    "TRV (Trivandrum)",
    "AYJ (Ayodhya)",
    "HYD (Hyderabad)",
  ];

export default function UpdateFlight() {
  const [flightId, setFlightId] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [flight, setFlight] = useState({
    carrierName: "",
    origin: "",
    destination: "",
    airFare: "",
    seatCapacityBusinessClass: "",
    seatCapacityEconomyClass: "",
    seatCapacityExecutiveClass: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const dataFetched = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState("");

  useEffect(() => {
      async function getCarrierNames() {
        const carriers = await fetch("http://localhost:4000/api/carriers/list", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
  
        const data = await carriers.json();
        if (carriers.ok) {
          data.data.forEach((c) => {
            carrierOptions.push(c.CarrierName);
          });
          setLoaded(true);
        }
      }
  
      if (!dataFetched.current) {
        getCarrierNames();
        dataFetched.current = true;
      }
    }, []);

  function handleBlur(k) {
    setTouched((s) => ({ ...s, [k]: true }));
  }

  function validateAll() {
    const e = {};
    if (!flight.carrierName) e.carrierName = "Required";
    // if (!nameRegex.test(flight.origin || "")) e.origin = "Invalid origin";
    // if (!nameRegex.test(flight.destination || "")) e.destination = "Invalid destination";
    const fare = Number(flight.airFare);
    if (!Number.isFinite(fare) || fare < 2000 || fare > 150000) e.airFare = "Fare must be 2,000–150,000";
    const b = Number(flight.seatCapacityBusinessClass);
    const ec = Number(flight.seatCapacityEconomyClass);
    const ex = Number(flight.seatCapacityExecutiveClass);
    if (!Number.isInteger(b) || b < 0 || b > 30) e.seatCapacityBusinessClass = "Business seats 0–30";
    if (!Number.isInteger(ec) || ec < 50 || ec > 70) e.seatCapacityEconomyClass = "Economy seats 50–70";
    if (!Number.isInteger(ex) || ex < 0 || ex > 8) e.seatCapacityExecutiveClass = "Executive seats 0–8";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLoad(e) {
    e && e.preventDefault();
    setStatus("");
    if (!flightId) {
      setStatus("Please enter Flight ID to load.");
      setToastType("error");
      setToastOpen(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/flights/${encodeURIComponent(flightId)}`);
      if (res.ok) {
        const data = await res.json();
        const f = data && data.flight ? data.flight : data;
        // Map backend keys to our fields if necessary
        setFlight({
          carrierName: f.carrierName || f.CarrierName || "",
          origin: f.origin || f.source || "",
          destination: f.destination || f.Destination || "",
          airFare: f.price || f.airfare || f.fare || "",
          seatCapacityBusinessClass: f.seats.business,
          seatCapacityEconomyClass: f.seats.economy,
          seatCapacityExecutiveClass: f.seats.executive,
        });
        setStatus("Loaded flight details. Edit fields and click Update.");
        setToastType("success");
        setToastOpen(true);
        setTouched({});
        setSubmitted(false);
        setOrigin(f.source);
      } else if (res.status === 404) {
        setStatus("Flight not found.");
        setToastType("error");
        setToastOpen(true);
      } else {
        const text = await res.text();
        setStatus(`Load failed: ${res.status} ${text}`);
        setToastType("error");
        setToastOpen(true);
      }
    } catch (err) {
      setStatus("Failed to load flight.");
      setToastType("error");
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(ev) {
    ev && ev.preventDefault();
    setStatus("");
    if (!flightId) {
      setStatus("Please enter Flight ID to update.");
      setToastType("error");
      setToastOpen(true);
      return;
    }
    setSubmitted(true);
    if (!validateAll()) return;
    setLoading(true);
    try {
      const payload = {
        carrierName: flight.carrierName,
        source: flight.origin,
        destination: flight.destination,
        price: Number(flight.airFare),
        seats: {
          economy: Number(flight.seatCapacityEconomyClass),
          business: Number(flight.seatCapacityBusinessClass),
          executive: Number(flight.seatCapacityExecutiveClass),
        }
      };

      // Prefer PUT /api/flights/:id
      let res = await fetch(`http://localhost:4000/api/flights/update/${encodeURIComponent(flightId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(payload),
      });

      // if (!res.ok) {
      //   // Try fallback POST /api/flights/update
      //   res = await fetch(`/api/flights/update`, {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ flightId, ...payload }),
      //   });
      // }

      if (res.ok) {
        const data = await res.json();
        const msg = data && (data.message || data.status || JSON.stringify(data));
        setStatus(`Update successful: ${msg}`);
        setToastType("success");
        setToastOpen(true);
      } else {
        const text = await res.text();
        setStatus(`Update failed: ${res.status} ${text}`);
        setToastType("error");
      setToastOpen(true);
      }
    } catch (err) {
      setStatus(`Failed to send update request. ${err.message}`);
      setToastType("error");
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function onChange(k, v) {
    setFlight((s) => ({ ...s, [k]: v }));
  }

  function clearAll() {
    setFlightId("");
    setFlight({ carrierName: "", origin: "", destination: "", airFare: "", seatCapacityBusinessClass: "", seatCapacityEconomyClass: "", seatCapacityExecutiveClass: "" });
    setErrors({});
    setTouched({});
    setSubmitted(false);
    setStatus("");
  }

  return (
    <div className="uf-root">
      <AdminNavBar />
      <Popup open={toastOpen} message={status} type={toastType} onClose={() => { setToastOpen(false); setStatus(''); }} />
      <div className="uf-card">
        <h2>Update Flight</h2>
        <form className="uf-form" onSubmit={handleUpdate}>
          <label className="uf-row">
            <span>Flight ID <span className="uf-required">*</span>
            </span>
            <input
            required
              value={flightId}
              onChange={(e) => setFlightId(e.target.value)}
              placeholder="Enter flight id"
            />
            <button
              type="button"
              className="uf-load"
              onClick={handleLoad}
              disabled={loading}
            >
              Load
            </button>
          </label>

          <label className="uf-row">
            <span>
              Carrier Name <span className="uf-required">*</span>
            </span>
            <select
              required
              value={flight.carrierName}
              onChange={(e) => onChange("carrierName", e.target.value)}
              onBlur={() => handleBlur("carrierName")}
            >
              {/* <option value="">-- Select Carrier --</option>
              <option>IndiGo</option>
              <option>Air India</option>
              <option>SpiceJet</option>
              <option>Vistara</option>
              <option>Air India Express</option>
              <option>Akasa Air</option>
              <option>Alliance Air</option> */}
              {!loaded ? (
                  <option value="Loading">Loading...</option>
                ) : (
                  <>
                    <option value="">Select carrier</option>
                    {carrierOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </>
                )}
            </select>
            
            <div className="uf-err">
              {(touched.carrierName || submitted) && errors.carrierName}
            </div>
          </label>

          <label className="uf-row">
            <span>
              Origin <span className="uf-required">*</span>
            </span>
            {/* <input required placeholder="City (letters only)" value={flight.origin} onChange={(e) => onChange("origin", e.target.value)} onBlur={() => handleBlur("origin")} /> */}
            <select
              // ref={originRef}
              required
              className="bk-input"
              aria-label="Origin"
              value={flight.origin}
              onChange={(e) => {
                const v = String(e.target.value || "");
                onChange("origin", e.target.value);
                // allow only known values (or empty)
                if (v !== "" && !places.includes(v)) {
                  console.warn("Unexpected Origin selected:", v);
                  setOrigin("");
                } else {
                  setOrigin(v);
                  // if user selects an origin equal to current destination, clear destination
                  if (v !== "" && v === destination) {
                    setDestination("");
                  }
                }
              }}
            >
              <option disabled value="">
                Select Origin
              </option>
              {places.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <div className="uf-err">
              {(touched.origin || submitted) && errors.origin}
            </div>
          </label>

          <label className="uf-row">
            <span>
              Destination <span className="uf-required">*</span>
            </span>
            {/* <input required placeholder="City (letters only)" value={flight.destination} onChange={(e) => onChange("destination", e.target.value)} onBlur={() => handleBlur("destination")} /> */}
            <select
              // ref={destRef}
              required
              className="bk-input"
              aria-label="Destination"
              value={flight.destination}
              onChange={(e) => {
                const v = String(e.target.value || "");
                onChange("destination", e.target.value);
                if (v !== "" && !places.includes(v)) {
                  console.warn("Unexpected Destination selected:", v);
                  setDestination("");
                } else {
                  setDestination(v);
                }
              }}
            >
              <option disabled value="">
                Select Destination
              </option>
              {places.map((p) => (
                // disable the option that matches selected origin
                <option key={p} value={p} disabled={p === origin}>
                  {p}
                  {p === origin ? " — (selected as origin)" : ""}
                </option>
              ))}
            </select>
            <div className="uf-err">
              {(touched.destination || submitted) && errors.destination}
            </div>
          </label>

          <label className="uf-row">
            <span>
              AirFare <span className="uf-required">*</span>
            </span>
            <input
              required
              placeholder="2000 - 150000"
              type="number"
              min="2000"
              max="150000"
              step="1"
              value={flight.airFare}
              onChange={(e) => onChange("airFare", e.target.value)}
              onBlur={() => handleBlur("airFare")}
            />
            <div className="uf-err">
              {(touched.airFare || submitted) && errors.airFare}
            </div>
          </label>

          <label className="uf-row">
            <span>
              Seats (Business) <span className="uf-required">*</span>
            </span>
            <input
              required
              placeholder="0 - 30"
              type="number"
              min="0"
              max="30"
              step="1"
              value={flight.seatCapacityBusinessClass}
              onChange={(e) =>
                onChange("seatCapacityBusinessClass", e.target.value)
              }
              onBlur={() => handleBlur("seatCapacityBusinessClass")}
            />
            <div className="uf-err">
              {(touched.seatCapacityBusinessClass || submitted) &&
                errors.seatCapacityBusinessClass}
            </div>
          </label>

          <label className="uf-row">
            <span>
              Seats (Economy) <span className="uf-required">*</span>
            </span>
            <input
              required
              placeholder="50 - 70"
              type="number"
              min="50"
              max="70"
              step="1"
              value={flight.seatCapacityEconomyClass}
              onChange={(e) =>
                onChange("seatCapacityEconomyClass", e.target.value)
              }
              onBlur={() => handleBlur("seatCapacityEconomyClass")}
            />
            <div className="uf-err">
              {(touched.seatCapacityEconomyClass || submitted) &&
                errors.seatCapacityEconomyClass}
            </div>
          </label>

          <label className="uf-row">
            <span>
              Seats (Executive) <span className="uf-required">*</span>
            </span>
            <input
              required
              placeholder="0 - 8"
              type="number"
              min="0"
              max="8"
              step="1"
              value={flight.seatCapacityExecutiveClass}
              onChange={(e) =>
                onChange("seatCapacityExecutiveClass", e.target.value)
              }
              onBlur={() => handleBlur("seatCapacityExecutiveClass")}
            />
            <div className="uf-err">
              {(touched.seatCapacityExecutiveClass || submitted) &&
                errors.seatCapacityExecutiveClass}
            </div>
          </label>

          <div className="uf-actions">
            <button type="submit" className="uf-update" disabled={loading}>
              {" "}
              {loading ? "Updating..." : "Update"}{" "}
            </button>
            <button
              type="button"
              className="uf-clear"
              onClick={() => {
                setFlightId("");
                setFlight({
                  carrierName: "",
                  origin: "",
                  destination: "",
                  airFare: "",
                  seatCapacityBusinessClass: "",
                  seatCapacityEconomyClass: "",
                  seatCapacityExecutiveClass: "",
                });
                setErrors({});
                setStatus("");
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
