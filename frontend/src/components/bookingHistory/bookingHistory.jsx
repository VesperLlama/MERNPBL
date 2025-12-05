import React, { useEffect, useState } from "react";
import CustomerNavbar from "../customerNavbar/customerNavbar.jsx";
import "./bookingHistory.css";

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // NEW ALERT BOX STATE
  const [alert, setAlert] = useState("");
  // Confirmation dialog state
  const [confirm, setConfirm] = useState({ open: false, pnr: null, bookingId: null, refund: null });

  const email =
    localStorage.getItem("email") ||
    localStorage.getItem("userEmail") ||
    localStorage.getItem("fullName");

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:4000/api/bookings/list", {
        headers: {
          "content-type": "aplication/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load bookings");

      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : data.bookings || [];

      const myBookings = email
        ? list.filter((b) =>
            [b.email, b.customerEmail, b.userEmail]
              .filter(Boolean)
              .some((v) => v?.toLowerCase() === email.toLowerCase())
          )
        : list;

      myBookings.sort((a, b) => {
        const t1 = new Date(a.date || a.travelDate || a.createdAt || 0).getTime();
        const t2 = new Date(b.date || b.travelDate || b.createdAt || 0).getTime();
        return t2 - t1;
      });

      setBookings(myBookings);
    } catch (err) {
      console.error(err);
      setError("Unable to load booking history.");
    } finally {
      setLoading(false);
    }
  }

  // Open confirmation dialog (called when user clicks Cancel)
  function handleCancel(pnr, bookingId, refund) {
    setConfirm({ open: true, pnr, bookingId, refund });
  }

  // Perform cancellation after user confirms
  async function performCancel() {
    const pnr = confirm.pnr;
    if (!pnr) return;

    try {
      const res = await fetch(`http://localhost:4000/api/bookings/cancel/${pnr}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const refund = data.booking && (data.booking.RefundAmount ?? data.booking.refundAmount ?? data.booking.Refund) ;
        setAlert(`Booking cancelled successfully! ₹${refund || 0} will be refunded to you in a few business days.`);
        await loadBookings();
      } else {
        setAlert(data.message || `Cancel failed: ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      setAlert('Failed to cancel booking.');
    } finally {
      setConfirm({ open: false, pnr: null, bookingId: null, refund: null });
      setTimeout(() => setAlert(""), 4000);
    }
  }

  return (
    <div className="bh-root">
      <CustomerNavbar />

      {/* ⭐ TOP ALERT BOX */}
      {alert && <div className="bh-alert">{alert}</div>}

      <div className="bh-container">
        <h2>Your Booking History</h2>

        {loading && <div className="bh-empty">Loading bookings...</div>}
        {error && <div className="bh-error">{error}</div>}

        {!loading && !error && bookings.length === 0 && (
          <div className="bh-empty">No bookings found.</div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="bh-table-wrap">
            <table className="bh-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Flight</th>
                  <th>Passenger(s)</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((b) => (
                  <tr key={b.BookingId}>
                    <td>{b.BookingId || b.id}</td>
                    <td>{b.flightNumber}</td>
                    <td>{b.Quantity || b.user?.name}</td>
                    <td>{b.origin || b.from}</td>
                    <td>{b.destination || b.to}</td>
                    <td>
                      {b.departure || b.travelDate
                        ? new Date(b.departure || b.travelDate).toLocaleString(
                            "en-IN",
                            {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "-"}
                    </td>
                    <td>₹{b.PricePaid}</td>

                    {/* ⭐ STATUS updated to grey when cancelled */}
                    <td>
                      <div
                        style={{
                          color: b.BookingStatus !== "Booked" ? "red" : "green",
                          fontWeight: 600,
                        }}
                      >
                        {b.BookingStatus}
                      </div>
                    </td>

                    <td>
                      {b.BookingStatus !== "Booked" ? (
                        <div style={{ fontWeight: 600, color: "#6b7280" }}>
                          {`Refund: ₹${b.RefundAmount ?? b.refundAmount ?? b.refund}`}
                        </div>
                      ) : (
                        <button
                          className="logout-btn"
                          disabled={b.cancelled}
                          onClick={() => handleCancel(b.PNR, b.BookingId, b.RefundAmount)}
                          style={{
                            opacity: b.cancelled ? 0.5 : 1,
                            cursor: b.cancelled ? "not-allowed" : "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Confirmation modal */}
            {confirm.open && (
              <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setConfirm({ open: false, pnr: null, bookingId: null, refund: null })} />
                <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 12px 40px rgba(2,6,23,0.2)', minWidth: 320, zIndex: 10000 }}>
                  <h3 style={{ marginTop: 0 }}>Confirm cancellation</h3>
                  <p>Are you sure you want to cancel booking <strong>{confirm.bookingId || confirm.pnr}</strong>?</p>
                  {confirm.refund !== null && <p>Refund: <strong>₹{confirm.refund}</strong></p>}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                    <button onClick={() => setConfirm({ open: false, pnr: null, bookingId: null, refund: null })} style={{ padding: '8px 12px', borderRadius: 6 }}>No</button>
                    <button onClick={performCancel} style={{ padding: '8px 12px', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none' }}>Yes, cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
