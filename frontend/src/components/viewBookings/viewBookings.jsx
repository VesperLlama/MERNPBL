import React, { useEffect, useState } from "react";
import AdminNavBar from "../adminNavBar/adminNavBar";
import "./viewBookings.css"; // new CSS file (example below)

export default function ViewBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState("");
  const [alertType, setAlertType] = useState("success");
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:4000/api/bookings/all", {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load bookings");

      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : data.bookings || [];

      // Normalize items
      const normalized = list.map((b) => ({
        ...b,
        idKey: b.BookingId || b.id,
        BookingStatus: b.BookingStatus || b.status || "Booked",
        cancelled:
          b.cancelled === true ||
          String(b.BookingStatus || b.status || "").toLowerCase() === "cancelled",
      }));

      setBookings(normalized);
    } catch (err) {
      console.error(err);
      setError("Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  function showAlert(msg, type = "success", ms = 3500) {
    setAlertType(type);
    setAlert(msg);
    setTimeout(() => setAlert(""), ms);
  }

  // Admin cancel not implemented in backend yet — show informative message
  async function handleCancel(booking) {
    showAlert("Admin cancel booking is not implemented on the server.", "error");
  }

  // Search & filter
  const filtered = bookings.filter((b) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      String(b.idKey).toLowerCase().includes(q) ||
      String(b.email || b.customerEmail || b.userEmail || b.user?.email || "")
        .toLowerCase()
        .includes(q) ||
      String(b.flightNumber || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="vb-root">
      <AdminNavBar />

      {alert && (
        <div className={`vb-alert ${alertType === "error" ? "vb-alert-error" : "vb-alert-success"}`}>
          {alert}
        </div>
      )}

      <div className="vb-container">
        <h2>All Bookings</h2>

        <div className="vb-controls">
          <input
            placeholder="Search by booking id, email or flight..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="vb-search"
          />
          <button className="vb-refresh" onClick={loadBookings}>Refresh</button>
        </div>

        {loading && <div className="vb-empty">Loading bookings...</div>}
        {error && <div className="vb-error">{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="vb-empty">No bookings found.</div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="vb-table-wrap">
            <table className="vb-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Flight</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((b) => {
                  const id = b.idKey;
                  const isCancelled = Boolean(b.cancelled || String(b.BookingStatus).toLowerCase() === "cancelled");
                  const isCancelling = Boolean(b.cancelling);

                  return (
                    <tr key={id}>
                      <td>{id}</td>
                      <td>{b.user?.name || b.customerName || b.fullName || "-"}</td>
                      <td>{b.email || b.customerEmail || b.userEmail || b.user?.email || "-"}</td>
                      <td>{b.flightNumber || "-"}</td>
                      <td>{b.origin || b.from || "-"}</td>
                      <td>{b.destination || b.to || "-"}</td>
                      <td>
                        {b.departure || b.travelDate
                          ? new Date(b.departure || b.travelDate).toLocaleString("en-IN", {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td>₹{b.amount ?? "-"}</td>
                      <td>
                        <div style={{ color: isCancelled ? "grey" : "green", fontWeight: 700 }}>
                          {b.BookingStatus}
                        </div>
                      </td>
                      <td>
                        <button
                          className="vb-cancel"
                          disabled={isCancelled || isCancelling}
                          onClick={() => handleCancel(b)}
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
