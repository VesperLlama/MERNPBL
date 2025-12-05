import React, { useEffect, useState } from "react";
import CustomerNavbar from "../customerNavbar/customerNavbar.jsx";
import "./customerDashboard.css";

export default function CustomerDashboard() {
  const fullName = JSON.parse(localStorage.getItem("user")).name.toUpperCase() || "Customer";

  const [upcoming, setUpcoming] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingFlight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUpcomingFlight() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/bookings/list", {
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
    });
      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : data.bookings || [];

      const email = (localStorage.getItem("email") || localStorage.getItem("userEmail") || "").toLowerCase();

      // If user email present, filter to their bookings; else show all
      const my = email
        ? list.filter((b) =>
            [b.email, b.customerEmail, b.userEmail, (b.user && b.user.email)]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase() === email)
          )
        : list;

      // Keep only future flights
      const future = my.filter((b) => {
        const d = new Date(b.departure);
        return !isNaN(d) && d >= new Date() && b.BookingStatus === "Booked";
      });

      if (future.length === 0) {
        setUpcoming(null);
        setLoading(false);
        return;
      }

      // pick soonest
      future.sort((a, b) => {
        const ta = new Date(a.date || a.travelDate || a.bookingTime).getTime();
        const tb = new Date(b.date || b.travelDate || b.bookingTime).getTime();
        return ta - tb;
      });

      setUpcoming(future[0]);
    } catch (err) {
      console.error("loadUpcomingFlight error", err);
      setUpcoming(null);
    } finally {
      setLoading(false);
    }
  }

  const open = (path) => {
    // use react-router if present, otherwise fallback to window.location
    try {
      window.location.href = path;
    } catch {
      window.location = path;
    }
  };

  return (
    <>
      <CustomerNavbar />

      <main className="cust-root">
        <div style={{"padding-top":"30px"}}></div>
        <div className="cust-container">
          <header className="cust-hero">
            <div>
              <h1>Welcome, <i><b style={{"color":"orange"}}>{fullName}</b></i></h1>
              <p className="cust-sub">Manage bookings, travel plans and your profile.</p>
            </div>
          </header>
<div style={{"padding-top":"10px"}}></div>
          <section className="cust-layout">
            {/* Left: Large upcoming flight card */}
            <div className="cust-left">
              <div className="upcoming-large">
                <div className="upcoming-head">
                  <h3>Upcoming Flight</h3>
                  {loading ? <small className="muted">Loading…</small> : null}
                </div>

                {!loading && !upcoming && (
                  <div className="up-empty">
                    No upcoming flights found. Book your next trip!
                  </div>
                )}

                {!loading && upcoming && (
                  <div className="up-content">
                    <div className="route">
                      <div style={{"color":"green"}} className="iata">{upcoming.origin || upcoming.from || "-"}</div>
                      <div className="arrow">→</div>
                      <div style={{"color":"green"}} className="iata to">{upcoming.destination || upcoming.to || "-"}</div>
                    </div>

                    <div className="meta">
                      <div>
                        <div className="meta-label">Date</div>
                        <div className="meta-value">
                          {new Date(upcoming.departure || upcoming.travelDate || upcoming.bookingTime).toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <div className="meta-label">Flight ID</div>
                        <div className="meta-value"><i>{upcoming.flightNumber || upcoming.id || "-"}</i></div>
                      </div>

                      <div>
                        <div className="meta-label">PNR</div>
                        <div className="meta-value"><i>{upcoming.PNR || upcoming.pnr || "-"}</i></div>
                      </div>
                    </div>

                    {/* <div className="up-actions">
                      <button className="btn primary" onClick={() => open(`/booking/${upcoming.bookingId || upcoming.id || ""}`)}>
                        View Booking
                      </button>
                      <button className="btn outline" onClick={() => open("/viewFlights")}>
                        Search Flights
                      </button>
                    </div> */}
                  </div>
                )}
              </div>
            </div>

            {/* Right: four small action cards (2x2) */}
            <aside className="cust-right">
              <div className="small-grid">
                <div className="action-card" onClick={() => open("/customer/searchFlight")}>
                  <div className="action-title">✈️ Book</div>
                  <div className="action-sub">Find and book flights</div>
                </div>

                {/* <div className="action-card" onClick={() => open("/customer/cancelBooking")}>
                  <div className="action-title">❌ Cancel</div>
                  <div className="action-sub">Cancel an existing booking</div>
                </div> */}

                <div className="action-card" onClick={() => open("/customer/allbookings")}>
                  <div className="action-title">🧾 History</div>
                  <div className="action-sub">Your bookings & tickets</div>
                </div>

                <div className="action-card" onClick={() => open("/customer/profile")}>
                  <div className="action-title">👤 Profile</div>
                  <div className="action-sub">Manage your account</div>
                </div>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </>
  );
}
