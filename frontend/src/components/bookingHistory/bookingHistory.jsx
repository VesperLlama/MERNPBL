import React, { useEffect, useState } from "react";
import CustomerNavbar from "../customerNavbar/customerNavbar.jsx";
import "./bookingHistory.css";

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      console.log(res.body);
      if (!res.ok) throw new Error("Failed to load bookings");

      const data = await res.json();
      console.log(data);
      const list = Array.isArray(data.data) ? data.data : data.bookings || [];
      console.log("list", list);
      // Filter by user email (if available)
      const myBookings = email
        ? list.filter((b) =>
            [b.email, b.customerEmail, b.userEmail]
              .filter(Boolean)
              .some((v) => v?.toLowerCase() === email.toLowerCase())
          )
        : list;
      console.log(myBookings);
      // Sort newest → oldest
      myBookings.sort((a, b) => {
        const t1 = new Date(
          a.date || a.travelDate || a.createdAt || 0
        ).getTime();
        const t2 = new Date(
          b.date || b.travelDate || b.createdAt || 0
        ).getTime();
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

  return (
    <div className="bh-root">
      <CustomerNavbar />

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
                  <th>Passenger</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
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
                    <td>₹{b.amount}</td>
                    <td
                      className={`bh-status ${String(
                        b.BookingStatus
                      ).toLowerCase()}`}
                    >
                      {b.Bookingtatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
