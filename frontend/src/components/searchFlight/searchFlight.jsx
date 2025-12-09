import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomerNavbar from "../customerNavbar/customerNavbar";
import "./searchFlight.css";
import Popup from "../pop-up/pop-up.jsx";

export default function SearchingPage() {
  const navigate = useNavigate();

  // refs for focusing invalid fields
  const originRef = useRef(null);
  const destRef = useRef(null);
  const dateRef = useRef(null);
  const adultsRef = useRef(null);
  const seatRef = useRef(null);

  // compute today's date (YYYY-MM-DD) to use as min on date input
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const minDate = `${yyyy}-${mm}-${dd}`;

  // shared places list (single source of truth)
  const places = [
    "DEL (Delhi)",
    "BOM (Mumbai)",
    "VNS (Varanasi)",
    "LKO (Lucknow)",
    "TRV (Trivandrum)",
    "AYJ (Ayodhya)",
    "HYD (Hyderabad)"
  ];

  // load saved values if any, ensure strings
  const [origin, setOrigin] = useState(String(localStorage.getItem("search_origin") || ""));
  const [destination, setDestination] = useState(String(localStorage.getItem("search_destination") || ""));
  const [date, setDate] = useState(String(localStorage.getItem("search_date") || ""));

  const [adults, setAdults] = useState(Number(localStorage.getItem("search_adults")) || 1);
  const [children, setChildren] = useState(Number(localStorage.getItem("search_children")) || 0);

  // Seat type: ensure it's always a string
  const [seatType, setSeatType] = useState(String(localStorage.getItem("search_seatType") || ""));

  // replaced inline error with popup
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const [popupType, setPopupType] = useState("error");
  const [popupDuration, setPopupDuration] = useState(3500);

  function showAlert(msg, type = "error", ms = 3500) {
    setPopupMsg(msg);
    setPopupType(type === "error" ? "error" : "success");
    setPopupDuration(ms);
    setPopupOpen(true);
  }

  // ensure if saved date is in past, clear it
  useEffect(() => {
    if (date) {
      const sel = new Date(date);
      const min = new Date(minDate);
      // compare dates only (ignore time)
      if (isNaN(sel.getTime()) || sel < min) {
        setDate("");
        localStorage.removeItem("search_date");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // single submit handler that prevents default and does navigation
  const handleSubmit = (e) => {
    try {
      e && e.preventDefault();
      // setError("");

      // Trim inputs
      const o = origin.trim();
      const d = destination.trim();

      // Validations (all required except children)
      if (!o) {
        showAlert("Please select a departure airport.", "error");
        originRef.current?.focus();
        return;
      }
      if (!d) {
        showAlert("Please select a destination airport.", "error");
        destRef.current?.focus();
        return;
      }
      if (o.toLowerCase() === d.toLowerCase()) {
        showAlert("Origin and destination must be different. Choose another destination.", "error");
        destRef.current?.focus();
        return;
      }
      if (!date) {
        showAlert("Please choose a departure date.", "error");
        dateRef.current?.focus();
        return;
      }
      // ensure date not in past
      const selected = new Date(date);
      const min = new Date(minDate);
      // zero time components for safe compare
      selected.setHours(0, 0, 0, 0);
      min.setHours(0, 0, 0, 0);
      if (selected < min) {
        showAlert("Departure date can't be in the past. Please select a future date.", "error");
        dateRef.current?.focus();
        return;
      }

      if (!adults || Number(adults) < 1) {
        showAlert("Please include at least one adult passenger.", "error");
        adultsRef.current?.focus();
        return;
      }

      if (children < 0) {
        showAlert("Children count can't be negative.", "error");
        return;
      }

      if (!seatType) {
        showAlert("Please choose a seat class (Economy, Business, or Executive).", "error");
        seatRef.current?.focus();
        return;
      }

      // Save to localStorage
      localStorage.setItem("search_origin", o);
      localStorage.setItem("search_destination", d);
      localStorage.setItem("search_date", date);
      localStorage.setItem("search_adults", String(adults));
      localStorage.setItem("search_children", String(children));
      localStorage.setItem("search_seatType", seatType);

      const params = new URLSearchParams({
        origin: o,
        destination: d,
        date,
        adults: String(adults),
        children: String(children),
        seatType,
      }).toString();

      // single navigation point
      navigate(`/customer/Bookings?${params}`);
    } catch (err) {
      // don't let an exception crash the whole app — show and log it
      console.error("Search submit error:", err);
      showAlert("Something went wrong while searching. Please try again in a moment.", "error", 5000);
    }
  };

  return (
    <>
      <CustomerNavbar />

      <div className="bk-root">
        <div className="bk-container">
          <h2>Search Flights</h2>
          {/* <p className="bk-sub">Search flights by route, date, passengers & seat type</p> */}

          <form className="bk-form" onSubmit={handleSubmit} noValidate>
            {/* ORIGIN + DESTINATION */}
            <div className="bk-row">
              <label className="bk-label ">
                <label className="required">From</label>
                <select
                  ref={originRef}
                  required
                  className="bk-input"
                  aria-label="Origin"
                  value={origin}
                  onChange={(e) => {
                    const v = String(e.target.value || "");
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
                  <option disabled value="">Select Origin</option>
                  {places.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              <label className="bk-label">
                <label className="required">To</label>
                <select
                  ref={destRef}
                  required
                  className="bk-input"
                  aria-label="Destination"
                  value={destination}
                  onChange={(e) => {
                    const v = String(e.target.value || "");
                    if (v !== "" && !places.includes(v)) {
                      console.warn("Unexpected Destination selected:", v);
                      setDestination("");
                    } else {
                      setDestination(v);
                    }
                  }}
                >
                  <option disabled value="">Select Destination</option>
                  {places.map((p) => (
                    // disable the option that matches selected origin
                    <option key={p} value={p} disabled={p === origin}>
                      {p}{p === origin ? " — (selected as origin)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* DATE + PASSENGERS */}
            <div className="bk-row">
              <label className="bk-label">
                <label className="required">Departure date</label>
                
                <input
                  ref={dateRef}
                  required
                  className="bk-input"
                  type="date"
                  min={minDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>

              <div className="bk-row">
                <label className="bk-label bk-inline">
                <label className="required">Passengers</label>
                  <div className="bk-passenger">
                    <button
                      type="button"
                      className="bk-num-btn"
                      onClick={() => setAdults((a) => Math.max(1, a - 1))}
                      aria-label="decrease adults"
                    >
                      −
                    </button>

                    <input
                      ref={adultsRef}
                      required
                      className="bk-input-small"
                      value={adults}
                      type="number"
                      min={1}
                      onChange={(e) => setAdults(Math.max(1, Number(e.target.value) || 1))}
                    />

                    <button
                      type="button"
                      className="bk-num-btn"
                      onClick={() => setAdults((a) => a + 1)}
                      aria-label="increase adults"
                    >
                      +
                    </button>
                  </div>
                </label>

                {/* <label className="bk-label bk-inline">
                  Children
                  <div className="bk-passenger">
                    <button
                      type="button"
                      className="bk-num-btn"
                      onClick={() => setChildren((c) => Math.max(0, c - 1))}
                      aria-label="decrease children"
                    >
                      −
                    </button>

                    <input
                      className="bk-input-small"
                      value={children}
                      type="number"
                      min={0}
                      onChange={(e) => setChildren(Math.max(0, Number(e.target.value) || 0))}
                    />

                    <button
                      type="button"
                      className="bk-num-btn"
                      onClick={() => setChildren((c) => c + 1)}
                      aria-label="increase children"
                    >
                      +
                    </button>
                  </div>
                </label> */}
              </div>
            </div>

            {/* SEAT TYPE */}
            <label className="bk-label" style={{ marginTop: 10 }}>
                <label className="required">Seat Type</label>
              <select
                ref={seatRef}
                required
                className="bk-input"
                value={seatType}
                onChange={(e) => {
                  const v = String(e.target.value || "");
                  const allowed = ["", "Economy", "Executive", "Business"];
                  if (!allowed.includes(v)) {
                    console.warn("Unexpected seat type selected:", v);
                    setSeatType("");
                  } else {
                    setSeatType(v);
                  }
                }}
              >
                <option disabled value="">Select seat type</option>
                <option value="Economy">Economy (Base Fare)</option>
                <option value="Business">Business (1.5 x Base Fare)</option>
                <option value="Executive">Executive (2.25 x Base Fare)</option>
              </select>
            </label>

            <Popup open={popupOpen} message={popupMsg} type={popupType} duration={popupDuration} onClose={() => setPopupOpen(false)} />

            <div style={{ marginTop: 14 }}>
              {/* button is type=submit only — no onClick handlers here */}
              <button type="submit" className="bk-submit">
                Search Flights
              </button>
            </div>
          </form>

          <div className="bk-hint">Tip: You can use airport IATA codes (e.g., DEL (Delhi), BOM (Mumbai)) or city names.</div>
        </div>
      </div>
    </>
  );
}