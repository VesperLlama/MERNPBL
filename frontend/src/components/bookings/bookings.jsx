// Bookings.jsx
import React, { useEffect, useState } from "react";
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
   *
   * Accepts several possible shapes:
   * - f.seats = { economy: 12 } -> available = 12
   * - f.seats = { economy: { capacity: 100, booked: 20 } } -> compute available = capacity - booked
   * - f.seats = { economy: { available: 80, booked: 20 } } -> available = 80
   * - f.seats = { economy: { total: 100, booked: 20 } } -> available = 80
   */
  function getSeatInfo(flight, category) {
    if (!flight || !flight.seats) return { available: null, capacity: null, booked: null };

    // normalize category key (lowercase)
    const key = (category || "").trim().toLowerCase();
    // try some common keys
    const candidates = [];
    if (key) candidates.push(key);
    candidates.push("economy", "business", "executive", "first", "premium"); // common fallbacks

    for (const k of candidates) {
      if (!k) continue;
      const val = flight.seats[k] ?? flight.seats[k.charAt(0).toUpperCase() + k.slice(1)];
      if (val == null) continue;

      // numeric means "available" number
      if (typeof val === "number") {
        return { available: val, capacity: val, booked: null };
      }

      // object shape
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

    // fallback: if flight.seats contains simple numbers under other keys, try any numeric value as available
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
      // Accept common field names
      const flightOrigin = normalize(f.source || f.from || f.departure || f.departureAirport || f.Origin);
      const flightDest = normalize(f.destination || f.to || f.arrival || f.arrivalAirport || f.Destination);

      // basic route match
      const routeOk =
        (!o || flightOrigin.includes(o) || flightOrigin === o) &&
        (!d || flightDest.includes(d) || flightDest === d);

      if (!routeOk) return false;

      // date match if provided (compare YYYY-MM-DD)
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

      // ---------- Seat-capacity checks ----------
      // If a seatParam is selected, ensure the flight has sufficient seats in that category
      if (seatParam) {
        const seatInfo = getSeatInfo(f, seatParam);
        // If we have a concrete available number, require requestedSeats <= available
        if (seatInfo.available != null) {
          if (requestedSeats > seatInfo.available) return false; // not enough seats for requested passengers
        }
        // If capacity/booked both exist, exclude flights where booked > capacity (invalid data)
        if (seatInfo.capacity != null && seatInfo.booked != null) {
          if (seatInfo.booked > seatInfo.capacity) return false; // invalid flight data
        }
      } else {
        // No seatParam selected: still exclude any flight that has a category with booked > capacity (invalid)
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

  const onBook = (flight) => {
    // Build price and routing info to send to payment page
    const fid = flight._id || flight.flightId || flight.id || "";
    const pricePerSeat = flight.price || flight.fare || flight.airFare || flight.airfare || flight.pricePerSeat || 0;
    const adults = adultsParam || 1;
    const children = childrenParam || 0;
    const totalPassengers = adults + children;
    const totalPrice = Number(pricePerSeat) * Number(totalPassengers);

    // gather basic flight fields
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

    // Redirect to payment page (so payment can use the passed live price)
    navigate(`/payment?${params.toString()}`);
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
            <div>Passengers: <strong>{adultsParam} adults, {childrenParam} children</strong></div>
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
                const id = f._id || f.flightId || f.id || `f-${idx}`;
                const airline = f.carrierName || f.airline || f.CarrierName || "Unknown";
                const origin = f.source || f.from || f.departureAirport || "-";
                const destination = f.destination || f.to || f.arrivalAirport || "-";
                const depart = f.departureTime || f.dep || f.departure || f.departure_time || "";
                const arrive = f.arrivalTime || f.arr || f.arrival || f.arrival_time || "";
                const price = f.price || f.fare || f.airFare || f.airfare || f.pricePerSeat || 0;

                // seat info for the selected seat category
                const seatInfo = getSeatInfo(f, seatParam);
                const seatsLabel =
                  seatInfo.available != null
                    ? `${seatInfo.available} seats`
                    : f.seats && typeof f.seats === "object"
                    ? "Seats info"
                    : "Seats info";

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
                      <div className="bk-price">₹{price}</div>
                      <div className="bk-seats">{seatsLabel}</div>
                      <div className="bk-actions">
                        <button
                          className="bk-book"
                          onClick={() => onBook(f)}
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
        </div>
      </div>
    </>
  );
}