import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import CustomerNavbar from "../customerNavbar/customerNavbar";
import "./bookings.css";

export default function Bookings() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Try to read from query params first, then fallback to localStorage
  const originParam = searchParams.get("origin") || localStorage.getItem("search_origin") || "";
  const destinationParam = searchParams.get("destination") || localStorage.getItem("search_destination") || "";
  const dateParam = searchParams.get("date") || localStorage.getItem("search_date") || "";
  const adultsParam = Number(searchParams.get("adults") ?? localStorage.getItem("search_adults") ?? 1);
  const childrenParam = Number(searchParams.get("children") ?? localStorage.getItem("search_children") ?? 0);
  const seatParam = searchParams.get("seatType") || localStorage.getItem("seatType") || "";

  const requestedSeats = Math.max(0, (adultsParam || 0) + (childrenParam || 0));

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [queryApplied, setQueryApplied] = useState(false);

  useEffect(() => {
    fetchFlights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originParam, destinationParam, dateParam, seatParam, adultsParam, childrenParam]);

  async function fetchFlights() {
    setLoading(true);
    setError("");
    setQueryApplied(false);

    try {
      // If your backend supports query filtering, prefer that:
      const qs = new URLSearchParams();
      if (originParam) qs.set("origin", originParam);
      if (destinationParam) qs.set("destination", destinationParam);
      if (dateParam) qs.set("date", dateParam);

      // Using your endpoint — keep it simple (backend filtering optional)
      const endpoint = 'http://localhost:4000/api/flights/all';
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.flights || [];
      setFlights(list);
      // apply client-side filtering for robustness (handles mixed backends)
      applyFilter(list);
      setQueryApplied(true);
    } catch (err) {
      console.error("fetchFlights error", err);
      setError("Failed to load flights. Try refreshing.");
      setFlights([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }

  function normalize(s) {
    return String(s || "").trim().toLowerCase();
  }

  /**
   * Robust helper to determine seat info for a given flight and category.
   * Returns an object: { available: number|null, capacity: number|null, booked: number|null }
   */
  function getSeatInfo(flight, category) {
    if (!flight || !flight.seats) return { available: null, capacity: null, booked: null };

    const key = (category || "").trim().toLowerCase();
    const candidates = [];
    if (key) candidates.push(key);
    candidates.push("economy", "business", "executive", "first", "premium");

    for (const k of candidates) {
      if (!k) continue;
      const val = flight.seats[k] ?? flight.seats[k.charAt(0).toUpperCase() + k.slice(1)];
      if (val == null) continue;

      if (typeof val === "number") {
        return { available: val, capacity: val, booked: null };
      }

      if (typeof val === "object") {
        const capacity = (val.capacity ?? val.total ?? val.max ?? null);
        const booked = (val.booked ?? val.allocated ?? val.reserved ?? null);
        const available = (val.available ?? (capacity != null && booked != null ? capacity - booked : null));
        return {
          available: available != null ? Number(available) : null,
          capacity: capacity != null ? Number(capacity) : null,
          booked: booked != null ? Number(booked) : null
        };
      }
    }

    const seatKeys = Object.keys(flight.seats || {});
    for (const k of seatKeys) {
      const v = flight.seats[k];
      if (typeof v === "number") return { available: v, capacity: v, booked: null };
      if (typeof v === "object" && (v.available || v.capacity || v.booked)) {
        const capacity = (v.capacity ?? v.total ?? null);
        const booked = (v.booked ?? null);
        const available = (v.available ?? (capacity != null && booked != null ? capacity - booked : null));
        return {
          available: available != null ? Number(available) : null,
          capacity: capacity != null ? Number(capacity) : null,
          booked: booked != null ? Number(booked) : null
        };
      }
    }

    return { available: null, capacity: null, booked: null };
  }

  function applyFilter(list) {
    const o = normalize(originParam);
    const d = normalize(destinationParam);
    const dt = (dateParam || "").trim();

    const out = list.filter((f) => {
      const flightOrigin = normalize(f.source || f.from || f.departure || f.departureAirport || f.Origin);
      const flightDest = normalize(f.destination || f.to || f.arrival || f.arrivalAirport || f.Destination);

      const routeOk =
        (!o || flightOrigin.includes(o) || flightOrigin === o) &&
        (!d || flightDest.includes(d) || flightDest === d);

      if (!routeOk) return false;

      let dateOk = true;
      if (dt) {
        const cand = f.departureTime || f.dep || f.date || f.travelDate || f.departure_date || f.departure;
        if (!cand) dateOk = false;
        else {
          const v = new Date(cand);
          if (isNaN(v)) dateOk = false;
          else {
            const ymd =
              v.getFullYear() +
              "-" +
              String(v.getMonth() + 1).padStart(2, "0") +
              "-" +
              String(v.getDate()).padStart(2, "0");
            dateOk = dt === ymd || dt === (f.date || "").split("T")[0] || dt === (f.travelDate || "").split("T")[0];
          }
        }
      }
      if (!dateOk) return false;

      if (seatParam) {
        const seatInfo = getSeatInfo(f, seatParam);
        if (seatInfo.available != null) {
          if (requestedSeats > seatInfo.available) return false;
        }
        if (seatInfo.capacity != null && seatInfo.booked != null) {
          if (seatInfo.booked > seatInfo.capacity) return false;
        }
      } else {
        if (f.seats && typeof f.seats === "object") {
          for (const k of Object.keys(f.seats)) {
            const s = f.seats[k];
            if (s && typeof s === "object") {
              const cap = s.capacity ?? s.total ?? s.max ?? null;
              const booked = s.booked ?? s.allocated ?? s.reserved ?? null;
              if (cap != null && booked != null && Number(booked) > Number(cap)) return false;
            }
          }
        }
      }

      return true;
    });

    setFiltered(out);
  }

  // ---- booking flow additions ----
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [showPassengerForm, setShowPassengerForm] = useState(false);
  const passengerRef = useRef();

  // seat multiplier (if seat types like Business/Executive should affect price)
  const seatMultiplier = useCallback((type) => {
    if (!type) return 1;
    if (String(type).toLowerCase() === "business") return 1.5;
    if (String(type).toLowerCase() === "executive") return 2.25;
    return 1; // Economy or default
  }, []);

  // ---------------------------
  // Improved PassengerForm
  // ---------------------------
  const PassengerForm = forwardRef(({ adults = 1, children = 0 }, ref) => {
    const totalSeats = Number(adults || 0) + Number(children || 0);
    const [passengers, setPassengers] = useState(() => {
      const arr = [];
      for (let i = 0; i < totalSeats; i++) {
        arr.push({ name: "", age: "", gender: i < Number(adults) ? "Adult" : "Child" });
      }
      return arr;
    });
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
      setPassengers((prev) => {
        const next = [];
        for (let i = 0; i < totalSeats; i++) {
          next[i] = {
            name: (prev[i] && prev[i].name) || "",
            age: (prev[i] && prev[i].age) || "",
            gender: (prev[i] && prev[i].gender) || (i < Number(adults) ? "Adult" : "Child"),
          };
        }
        return next;
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adults, children, totalSeats]);

    const updateField = (index, field, value) => {
      setPassengers((prev) => {
        const copy = prev.map((p) => ({ ...p }));
        copy[index][field] = value;
        return copy;
      });
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[`${index}.${field}`];
        return copy;
      });
    };

    const validate = () => {
      const errors = [];
      const newFieldErrors = {};
      passengers.forEach((p, i) => {
        const name = (p.name || "").toString().trim();
        const ageRaw = (p.age || "").toString().trim();
        if (!name) {
          errors.push({ index: i, field: "name", message: "Name is required" });
          newFieldErrors[`${i}.name`] = "Name is required";
        }
        if (!ageRaw) {
          errors.push({ index: i, field: "age", message: "Age is required" });
          newFieldErrors[`${i}.age`] = "Age is required";
        } else {
          if (!/^\d+$/.test(ageRaw)) {
            errors.push({ index: i, field: "age", message: "Age must be a positive integer" });
            newFieldErrors[`${i}.age`] = "Age must be a positive integer";
          } else {
            const ageNum = Number(ageRaw);
            if (ageNum <= 0 || ageNum > 120) {
              errors.push({ index: i, field: "age", message: "Enter a realistic age (1-120)" });
              newFieldErrors[`${i}.age`] = "Enter a realistic age (1-120)";
            }
          }
        }
        if (!p.gender) {
          errors.push({ index: i, field: "gender", message: "Gender is required" });
          newFieldErrors[`${i}.gender`] = "Gender is required";
        }
      });

      setFieldErrors(newFieldErrors);
      if (errors.length === 0) return { ok: true, passengers };
      return { ok: false, errors };
    };

    useImperativeHandle(ref, () => ({
      validate,
      getPassengers: () => passengers.map((p) => ({ ...p })),
    }));

    return (
      <div className="passenger-form-root">
        <h3 className="pf-title">Passenger Details <span className="pf-count">({passengers.length})</span></h3>

        {passengers.map((p, i) => (
          <div className="pf-card" key={i}>
            <div className="pf-row-header">
              <strong>Passenger {i + 1}</strong>
              {/* <span className="pf-tag">{i < Number(adults) ? "Adult" : "Child"}</span> */}
            </div>

            <div className="pf-fields">
              <label className="pf-field">
                <div className="pf-label">Full name</div>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updateField(i, "name", e.target.value)}
                  placeholder="Enter full name"
                  className={fieldErrors[`${i}.name`] ? "pf-input pf-input-error" : "pf-input"}
                />
                {fieldErrors[`${i}.name`] && <div className="pf-err">{fieldErrors[`${i}.name`]}</div>}
              </label>

              <label className="pf-field">
                <div className="pf-label">Age</div>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={p.age}
                  onChange={(e) => updateField(i, "age", e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="e.g. 28"
                  className={fieldErrors[`${i}.age`] ? "pf-input pf-input-error" : "pf-input"}
                />
                {fieldErrors[`${i}.age`] && <div className="pf-err">{fieldErrors[`${i}.age`]}</div>}
              </label>

              <label className="pf-field">
                <div className="pf-label">Gender</div>
                <select
                  value={p.gender || ""}
                  onChange={(e) => updateField(i, "gender", e.target.value)}
                  className={fieldErrors[`${i}.gender`] ? "pf-select pf-input-error" : "pf-select"}
                >
                  <option value="" disabled>Choose gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  {/* <option value="Adult" hidden>Adult</option>
                  <option value="Child" hidden>Child</option> */}
                </select>
                {fieldErrors[`${i}.gender`] && <div className="pf-err">{fieldErrors[`${i}.gender`]}</div>}
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  });

  // When user clicks Book — show passenger form for that flight
  function handleBookClick(flight) {
    setSelectedFlight(flight);
    setShowPassengerForm(true);
    // optional: scroll into view
    setTimeout(() => {
      const el = document.querySelector(".passenger-form-root");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  function handleCancelBooking() {
    setSelectedFlight(null);
    setShowPassengerForm(false);
  }

  function handleCompleteBooking() {
    if (!selectedFlight) return;

    // validate passenger form if present
    if (passengerRef.current) {
      const res = passengerRef.current.validate();
      if (!res.ok) {
        // scroll to passenger form errors
        window.scrollTo({
          top:
            document.querySelector(".passenger-form-root")?.getBoundingClientRect().top +
            window.scrollY -
            80 || 0,
          behavior: "smooth",
        });
        return;
      }
    }

    // compute price and totals (unchanged)
    const basePrice = Number(
      selectedFlight.price ??
        selectedFlight.fare ??
        selectedFlight.airFare ??
        selectedFlight.pricePerSeat ??
        0
    );
    const mult = seatMultiplier(seatParam || "Economy");
    const pricePerSeat = Math.round(basePrice * mult);
    const totalPassengers = Math.max(
      1,
      Number(adultsParam || 0) + Number(childrenParam || 0)
    );
    const totalPrice = pricePerSeat * totalPassengers;

    // gather flight info to pass along
    const fid = selectedFlight.flightNumber || selectedFlight.flightId || selectedFlight.id || "";
    const from = selectedFlight.origin || selectedFlight.from || selectedFlight.source || "";
    const to = selectedFlight.destination || selectedFlight.to || selectedFlight.arrival || "";
    const dep = selectedFlight.departureTime || selectedFlight.dep || selectedFlight.departure || "";
    const arr = selectedFlight.arrivalTime || selectedFlight.arr || selectedFlight.arrival || "";
    const airline = selectedFlight.carrierName || selectedFlight.airline || selectedFlight.CarrierName || "";

    const rawPassengers = passengerRef.current ? passengerRef.current.getPassengers() : [];
    const passengers = rawPassengers.map((p) => ({
      name: p.name ?? "",
      age: p.age ?? "",
      gender: p.gender ?? "",
    }));

    const params = new URLSearchParams({
      flightId: fid,
      pricePerSeat: String(pricePerSeat),
      totalPrice: String(totalPrice),
      from,
      to,
      dep,
      arr,
      airline,
      adults: String(adultsParam || 1),
      children: String(childrenParam || 0),
      seatType: seatParam || "Economy",
    });

    // navigate to payment page (pass passengers in router state)
    navigate(`/payment?${params.toString()}`, {
      state: {
        flight: {
          flightId: fid,
          from, to, dep, arr, airline,
          pricePerSeat,
          totalPrice,
          adults: adultsParam,
          children: childrenParam,
          seatType: seatParam || "Economy"
        },
        passengers
      }
    });
  }

  // existing onBook left intact for compatibility (not used by new flow) — pass empty passengers array
  const onBook = (flight) => {
    const fid = flight._id || flight.flightId || flight.id || "";
    const pricePerSeat = flight.price || flight.fare || flight.airFare || flight.airfare || flight.pricePerSeat || 0;
    const adults = adultsParam || 1;
    const children = childrenParam || 0;
    const totalPassengers = adults + children;
    const totalPrice = Number(pricePerSeat) * Number(totalPassengers);

    const from = flight.origin || flight.from || flight.source || "";
    const to = flight.destination || flight.to || flight.arrival || "";
    const dep = flight.departureTime || flight.dep || flight.departure || "";
    const arr = flight.arrivalTime || flight.arr || flight.arrival || "";
    const airline = flight.carrierName || flight.airline || flight.CarrierName || "";

    const params = new URLSearchParams({
      flightId: fid,
      pricePerSeat: String(pricePerSeat),
      totalPrice: String(totalPrice),
      from,
      to,
      dep,
      arr,
      airline,
      adults: String(adults),
      children: String(children)
    });

    navigate(`/payment?${params.toString()}`, {
      state: {
        flight: {
          flightId: fid,
          from, to, dep, arr, airline,
          pricePerSeat,
          totalPrice,
          adults,
          children
        },
        passengers: []
      }
    });
  };

  return (
    <>
      <CustomerNavbar />

      <div className="bk-list-root">
        <div className="bk-list-container">
          <h2>Available Flights</h2>

          <div className="bk-criteria">
            <div>From: <strong>{originParam || "Any"}</strong></div>
            <div>To: <strong>{destinationParam || "Any"}</strong></div>
            <div>Date: <strong>{dateParam || "Any"}</strong></div>
            <div>Passengers: <strong>{adultsParam + childrenParam} </strong></div>
            <div>Seat Type: <strong>{seatParam || "Any"}</strong></div>
          </div>

          <div className="bk-controls">
            <button className="bk-new-search" onClick={() => navigate("/customer/searchflight")}>New Search</button>
          </div>

          {error && <div className="bk-error">{error}</div>}

          {!error && !loading && queryApplied && filtered.length === 0 && (
            <div className="bk-empty">No flights matched your search.</div>
          )}

          {!error && loading && <div className="bk-empty">Loading flights…</div>}

          {!error && !loading && filtered.length > 0 && (
            <div className="bk-grid">
              {filtered.map((f, idx) => {
                const id = f._id || f.flightNumber || f.id || `f-${idx}`;
                const airline = f.carrierName || f.airline || f.CarrierName || "Unknown";
                const origin = f.source || f.from || f.departureAirport || "-";
                const destination = f.destination || f.to || f.arrivalAirport || "-";
                const depart = f.departureTime || f.dep || f.departure || f.departure_time || "";
                const arrive = f.arrivalTime || f.arr || f.arrival || f.arrival_time || "";
                const priceRaw = f.price || f.fare || f.airFare || f.airfare || f.pricePerSeat || 0;
                const price = Math.round(Number(priceRaw) * seatMultiplier(seatParam || "Economy"));

                const seatInfo = getSeatInfo(f, seatParam);
                const seatsLabel =
                  seatInfo.available != null
                    ? `${seatInfo.available} seats`
                    : f.seats && typeof f.seats === "object"
                    ? "Seats info"
                    : "Seats info";

                // if passenger form is active, hide other flights
                if (showPassengerForm && selectedFlight && (selectedFlight._id || selectedFlight.flightId || selectedFlight.id || selectedFlight) !== (f._id || f.flightId || f.id || f)) {
                  return null;
                }

                return (
                  <div className="bk-card" key={id}>
                    <div className="bk-card-left">
                      <div className="bk-airline">{airline}</div>
                      <div className="bk-route">{origin} → {destination}</div>
                      <div className="bk-times">
                        <span>Dep: {depart ? new Date(depart).toLocaleString() : "-"}</span>
                        <span>Arr: {arrive ? new Date(arrive).toLocaleString() : "-"}</span>
                      </div>
                    </div>

                    <div className="bk-card-right">
                      <div className="bk-price">₹{price}<span style={{"fontSize":"13px", "fontWeight":"normal"}}>/seat</span></div>
                      <div className="bk-seats">{seatsLabel} available</div>
                      <div className="bk-actions">
                        <button
                          className="bk-book"
                          onClick={() => handleBookClick(f)}
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Booking panel - shown when a flight is selected for booking */}
          {showPassengerForm && selectedFlight && (
            <div className="booking-panel" style={{ marginTop: 18 }}>
              <div className="selected-flight-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div>Flight ID: <p style={{ fontWeight: 500, display: "inline" }}>{selectedFlight.flightNumber || ""}</p></div>
                    <div>Seat: <p style={{ fontWeight: 500, display: "inline" }}>{seatParam || ""}</p></div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div>Price/seat: <p style={{ fontWeight: 500, display: "inline" }}>₹{Math.round(Number(selectedFlight.price ?? selectedFlight.fare ?? selectedFlight.airFare ?? selectedFlight.pricePerSeat ?? 0) * seatMultiplier(seatParam || "Economy")).toLocaleString()}</p></div>
                    <div>Total (x {adultsParam + childrenParam}): <p style={{ fontWeight: 500, display: "inline" }}>₹{(Math.round(Number(selectedFlight.price ?? selectedFlight.fare ?? selectedFlight.airFare ?? selectedFlight.pricePerSeat ?? 0) * seatMultiplier(seatParam || "Economy")) * (adultsParam + childrenParam)).toLocaleString()}</p></div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <PassengerForm ref={passengerRef} adults={adultsParam} children={childrenParam} />
                </div>

                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button className="bk-submit" onClick={handleCompleteBooking}>Complete Booking</button>
                  <button className="bk-cancel" onClick={handleCancelBooking}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
