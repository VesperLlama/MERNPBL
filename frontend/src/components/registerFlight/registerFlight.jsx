import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
import Popup from "../pop-up/pop-up.jsx";
import "./registerFlight.css";
import { useEffect, useRef ,useMemo} from "react";

let carrierOptions = [];
const airports = [
  "DEL (Delhi)",
  "BOM (Mumbai)",
  "VNS (Varanasi)",
  "LKO (Lucknow)",
  "TRV (Trivandrum)",
  "AYJ (Ayodhya)",
];

export default function RegisterFlight() {
  const [form, setForm] = useState({
    carrierName: "",
    origin: "",
    destination: "",
    airFare: "",
    arrivalTime: "",
    departureTime: "",
    seatsBusiness: "",
    seatsEconomy: "",
    seatsExecutive: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const [popupType, setPopupType] = useState("success");
  const dataFetched = useRef(false);
  const [loaded, setLoaded] = useState(false);

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

  function setErr(k, msg) {
    setErrors((e) => {
      const ne = { ...e };
      if (msg) ne[k] = msg;
      else delete ne[k];
      return ne;
    });
  }

  // Helper: parse to Date safely
  function toDate(v) {
    return v ? new Date(v) : null;
  }

  function validateField(name) {
    const v = (form[name] || "").toString().trim();
    const now = new Date();

    switch (name) {
      case "carrierName":
        if (!v) setErr(name, "Carrier is required");
        else setErr(name, null);
        break;

      case "origin":
        if (!v) setErr(name, "This field is required");
        else if (v === form.destination)
          setErr(name, "Origin and Destination cannot be the same");
        else setErr(name, null);

        // validate destination again because it depends on origin
        // validateField("destination");
        break;

      case "destination":
        if (!v) setErr(name, "This field is required");
        else if (v === form.origin)
          setErr(name, "Origin and Destination cannot be the same");
        else setErr(name, null);

        // validate origin again because it depends on destination
        // validateField("origin");
        break;

      case "airFare": {
        if (v === "") setErr(name, "AirFare is required");
        else {
          const n = Number(v);
          if (Number.isNaN(n) || n < 2000 || n > 150000)
            setErr(name, "Enter fare between 2000 and 150000");
          else setErr(name, null);
        }
        break;
      }

      case "seatsBusiness":
        validateIntRange(name, v, 0, 30);
        break;
      case "seatsEconomy":
        validateIntRange(name, v, 50, 70);
        break;
      case "seatsExecutive":
        validateIntRange(name, v, 0, 8);
        break;

      case "departureTime": {
        if (!v) {
          setErr(name, "Departure time is required");
          break;
        }
        const dep = toDate(v);
        if (dep < now) {
          setErr(name, "Departure cannot be before current date/time");
        } else setErr(name, null);

        // Validate arrival again because it depends on departure
        // validateField("arrivalTime");
        break;
      }

      case "arrivalTime": {
        if (!v) {
          setErr(name, "Arrival time is required");
          break;
        }

        const arr = toDate(v);
        const dep = toDate(form.departureTime);

        if (!dep) {
          setErr(name, "Select departure time first");
          break;
        }

        const diffMin = (arr - dep) / (1000 * 60);

        if (diffMin < 30) {
          setErr(name, "Arrival must be at least 30 minutes after departure");
        } else if (diffMin > 2880) {
          setErr(name, "Arrival cannot be more than 2 days after departure");
        } else {
          setErr(name, null);
        }
        break;
      }

      default:
        break;
    }
  }

  function validateIntRange(name, v, min, max) {
    if (v === "") {
      setErr(name, "This field is required");
      return;
    }
    const n = Number(v);
    if (!Number.isInteger(n) || n < min || n > max)
      setErr(name, `Enter integer between ${min} and ${max}`);
    else setErr(name, null);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (touched[name]) validateField(name);
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    validateField(name);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);

    Object.keys(form).forEach((k) => validateField(k));

    await new Promise((r) => setTimeout(r, 50));

    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);

    try {
      const payload = {
        carrierName: form.carrierName,
        source: form.origin,
        destination: form.destination,
        price: Number(form.airFare),
        arrivalTime: form.arrivalTime,
        departureTime: form.departureTime,
        seats: {
          economy: Number(form.seatsEconomy),
          business: Number(form.seatsBusiness),
          executive: Number(form.seatsExecutive),
        },
      };

      const res = await fetch("http://localhost:4000/api/flights/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setPopupMsg(`Flight registered successfully. Flight ID: ${data.data.flightNumber}`);
      setPopupType("success");
      setPopupOpen(true);

      setForm({
        carrierName: "",
        origin: "",
        destination: "",
        airFare: "",
        arrivalTime: "",
        departureTime: "",
        seatsBusiness: "",
        seatsEconomy: "",
        seatsExecutive: "",
      });
      setErrors({});
      setTouched({});
      setSubmitted(false);
    } catch (err) {
      setPopupMsg("Failed to register flight: " + err.message);
      setPopupType("error");
      setPopupOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#5da399",
      }}
    >
      <AdminNavBar />
      <Popup open={popupOpen} message={popupMsg} type={popupType} onClose={() => setPopupOpen(false)} />

      <div
        style={{
          width: "100%",
          maxWidth: 980,
          margin: "28px auto",
          background: "#fff",
          padding: 22,
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(9,30,66,0.06)",
        }}
      >
        <h2>Register Flight</h2>
        <p className="required-note">
          Fields marked <span className="req">*</span> are required
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid">
            {/* Carrier */}
            <div className="col">
              <label className="required">Carrier Name</label>
              <select
                name="carrierName"
                value={form.carrierName}
                onChange={handleChange}
                onBlur={handleBlur}
              >
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
              {errors.carrierName && (touched.carrierName || submitted) && (
                <div className="error">{errors.carrierName}</div>
              )}
            </div>

            {/* Origin */}
            <div className="col">
              <label className="required">From</label>
              <select
                name="origin"
                value={form.origin}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="">Select Origin</option>
                {airports.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.origin && (touched.origin || submitted) && (
                <div className="error">{errors.origin}</div>
              )}
            </div>

            {/* Destination */}
            <div className="col">
              <label className="required">To</label>
              <select
                name="destination"
                value={form.destination}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="">Select Destination</option>
                {airports.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.destination && (touched.destination || submitted) && (
                <div className="error">{errors.destination}</div>
              )}
            </div>

            {/* Fare */}
            <div className="col">
              <label className="required">Air Fare (INR)</label>
              <input
                name="airFare"
                value={form.airFare}
                onChange={handleChange}
                onBlur={handleBlur}
                type="number"
                min="2000"
                max="150000"
                placeholder="2000 - 150000"
              />
              {errors.airFare && (touched.airFare || submitted) && (
                <div className="error">{errors.airFare}</div>
              )}
            </div>

            {/* Departure */}
            <div className="col">
              <label className="required">Departure Time</label>
              <input
                name="departureTime"
                value={form.departureTime}
                onChange={handleChange}
                onBlur={handleBlur}
                type="datetime-local"
              />
              {errors.departureTime && (touched.departureTime || submitted) && (
                <div className="error">{errors.departureTime}</div>
              )}
            </div>

            {/* Arrival */}
            <div className="col">
              <label className="required">Arrival Time</label>
              <input
                name="arrivalTime"
                value={form.arrivalTime}
                onChange={handleChange}
                onBlur={handleBlur}
                type="datetime-local"
              />
              {errors.arrivalTime && (touched.arrivalTime || submitted) && (
                <div className="error">{errors.arrivalTime}</div>
              )}
            </div>

            {/* Business */}
            <div className="col">
              <label className="required">Seat Capacity - Business</label>
              <input
                name="seatsBusiness"
                value={form.seatsBusiness}
                onChange={handleChange}
                onBlur={handleBlur}
                type="number"
                min="0"
                max="30"
                placeholder="0 - 30"
              />
              {errors.seatsBusiness && (touched.seatsBusiness || submitted) && (
                <div className="error">{errors.seatsBusiness}</div>
              )}
            </div>

            {/* Economy */}
            <div className="col">
              <label className="required">Seat Capacity - Economy</label>
              <input
                name="seatsEconomy"
                value={form.seatsEconomy}
                onChange={handleChange}
                onBlur={handleBlur}
                type="number"
                min="50"
                max="70"
                placeholder="50 - 70"
              />
              {errors.seatsEconomy && (touched.seatsEconomy || submitted) && (
                <div className="error">{errors.seatsEconomy}</div>
              )}
            </div>

            {/* Executive */}
            <div className="col">
              <label className="required">Seat Capacity - Executive</label>
              <input
                name="seatsExecutive"
                value={form.seatsExecutive}
                onChange={handleChange}
                onBlur={handleBlur}
                type="number"
                min="0"
                max="8"
                placeholder="0 - 8"
              />
              {errors.seatsExecutive &&
                (touched.seatsExecutive || submitted) && (
                  <div className="error">{errors.seatsExecutive}</div>
                )}
            </div>
          </div>

          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 18 }}
          >
            <button style={{background: "#397367"}} className="primary" type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Register Flight"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
