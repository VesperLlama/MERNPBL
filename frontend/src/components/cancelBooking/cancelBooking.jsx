import React, { useEffect, useState } from "react";
import CustomerNavbar from "../customerNavbar/customerNavbar";
import "./cancelBooking.css";

/**
 * CancelBooking page:
 * - loads bookings from /api/bookings
 * - filters to current user (by email in localStorage)
 * - shows bookings with status and provides Cancel button
 * - calls backend to cancel (DELETE /api/bookings/:id or POST /api/bookings/:id/cancel)
 */
export default function CancelBooking() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // try to detect logged-in user
  const userEmail =
    (localStorage.getItem("email") || localStorage.getItem("userEmail") || "").toLowerCase();

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.bookings || [];

      // filter to user if email present, otherwise show all
      const filtered = userEmail
        ? list.filter((b) =>
            [b.email, b.customerEmail, b.userEmail, b.user?.email]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase() === userEmail)
          )
        : list;

      // sort newest first
      filtered.sort((a, b) => {
        const ta = new Date(a.date || a.travelDate || a.createdAt || 0).getTime();
        const tb = new Date(b.date || b.travelDate || b.createdAt || 0).getTime();
        return tb - ta;
      });

      setBookings(filtered);
    } catch (err) {
      console.error("load bookings failed", err);
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  // Cancel handler: optimistic UI update then API call
  async function handleCancel(booking) {
    const id = booking.bookingId || booking.id;
    if (!id) {
      alert("Booking id not found.");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    // optimistic update
    setProcessingId(id);
    const prev = [...bookings];
    setBookings((s) => s.map((b) => (b.bookingId === id || b.id === id ? { ...b, status: "CANCELLED" } : b)));

    try {
      // Try DELETE endpoint first
      let res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });

      // If DELETE not supported, try cancel endpoint
      if (res.status === 404 || res.status === 405) {
        res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      }

      if (!res.ok) {
        // backend might respond 200 with JSON.success=false — handle generically
        const text = await res.text();
        throw new Error(text || `Cancel failed (${res.status})`);
      }

      // success — leave UI updated
      setProcessingId(null);
    } catch (err) {
      console.error("cancel failed", err);
      alert(err?.message || "Cancel request failed. Please try again.");
      // rollback optimistic update
      setBookings(prev);
      setProcessingId(null);
    }
  }

  return (
    <>
      <CustomerNavbar />

      <div className="cb-root">
        <div className="cb-container">
          <h2>Cancel Booking</h2>
          <p className="cb-sub">Select a booking below to cancel it. Cancelled bookings cannot be recovered.</p>

          {loading && <div className="cb-empty">Loading your bookings...</div>}
          {error && <div className="cb-error">{error}</div>}

          {!loading && !error && bookings.length === 0 && (
            <div className="cb-empty">No bookings found.</div>
          )}

          {!loading && !error && bookings.length > 0 && (
            <div className="cb-list">
              {bookings.map((b) => {
                const id = b.bookingId || b.id || "";
                const flight = b.flightId || b.flight || "-";
                const from = b.origin || b.from || "-";
                const to = b.destination || b.to || "-";
                const date = b.date || b.travelDate || b.bookingTime || null;
                const status = (b.status || "UNKNOWN").toUpperCase();
                const isCancelled = status === "CANCELLED" || status === "CANCELED";
                const isProcessing = processingId && (processingId === id);

                return (
                  <div className="cb-item" key={id || Math.random()}>
                    <div className="cb-main">
                      <div className="cb-line">
                        <div className="cb-flight">{flight}</div>
                        <div className={`cb-status ${isCancelled ? "cancelled" : (status === "CONFIRMED" ? "confirmed" : "pending")}`}>
                          {status}
                        </div>
                      </div>

                      <div className="cb-meta">
                        <div className="cb-route">{from} → {to}</div>
                        <div className="cb-date">{date ? new Date(date).toLocaleString() : "-"}</div>
                        <div className="cb-passenger">{b.passengerName || b.user?.name || "-"}</div>
                      </div>
                    </div>

                    <div className="cb-actions">
                      <button
                        className="cb-view"
                        onClick={() => (window.location.href = `/booking/${id}`)}
                      >
                        View
                      </button>

                      <button
                        className="cb-cancel"
                        disabled={isCancelled || isProcessing}
                        onClick={() => handleCancel(b)}
                      >
                        {isProcessing ? "Cancelling..." : (isCancelled ? "Cancelled" : "Cancel")}
                      </button>
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