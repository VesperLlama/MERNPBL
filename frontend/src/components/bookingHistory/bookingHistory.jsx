import React, { useEffect, useState } from "react";
import CustomerNavbar from "../customerNavbar/customerNavbar.jsx";
import "./bookingHistory.css";
import Popup from "../pop-up/pop-up.jsx";

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // NEW ALERT BOX STATE (kept for legacy usage but shown via Popup)
  // NEW ALERT BOX STATE (kept for legacy usage but shown via Popup)
  const [alert, setAlert] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");
  // Confirmation dialog state
  const [confirm, setConfirm] = useState({ open: false, pnr: null, bookingId: null, refund: null });
  const [downloading, setDownloading] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const email =
    localStorage.getItem("email") ||
    localStorage.getItem("userEmail") ||
    localStorage.getItem("fullName");

  useEffect(() => {
    loadBookings();
  }, []);

  // mirror legacy `alert` into toaster when set from other places
  useEffect(() => {
    if (!alert) return;
    setToastMsg(alert);
    const low = String(alert || "").toLowerCase();
    const isError = low.includes('fail') || low.includes('failed') || low.includes('error') || low.includes('cancel failed');
    setToastType(isError ? 'error' : 'success');
    setToastOpen(true);
  }, [alert]);

  // mirror legacy `alert` into toaster when set from other places
  useEffect(() => {
    if (!alert) return;
    setToastMsg(alert);
    const low = String(alert || "").toLowerCase();
    const isError = low.includes('fail') || low.includes('failed') || low.includes('error') || low.includes('cancel failed');
    setToastType(isError ? 'error' : 'success');
    setToastOpen(true);
  }, [alert]);

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
        const refund = data.booking && (data.booking.RefundAmount ?? data.booking.refundAmount ?? data.booking.Refund);
        const msg = `Booking cancelled successfully! ₹${refund || 0} will be refunded to you in a few business days.`;
        setAlert(msg);
        setToastMsg(msg);
        setToastType('success');
        setToastOpen(true);
        await loadBookings();
      } else {
        const msg = data.message || `Cancel failed: ${res.status}`;
        setAlert(msg);
        setToastMsg(msg);
        setToastType('error');
        setToastOpen(true);
      }
    } catch (err) {
      console.error(err);
      const msg = 'Failed to cancel booking.';
      setAlert(msg);
      setToastMsg(msg);
      setToastType('error');
      setToastOpen(true);
    } finally {
      setConfirm({ open: false, pnr: null, bookingId: null, refund: null });
      setTimeout(() => setAlert(""), 4000);
    }
  }

  // Download boarding pass as PDF (saves file locally)
  async function downloadBoardingPass(booking) {
    const id = booking.BookingId || booking.id || booking.bookingId || booking.BookingId;
    if (!id) {
      const msg = 'Booking id missing for this record.';
      setAlert(msg);
      setToastMsg(msg);
      setToastType('error');
      setToastOpen(true);
      setTimeout(() => setAlert(''), 3000);
      return;
    }

    setDownloading(id);
    try {
      const res = await fetch(`http://localhost:4000/api/bookings/boardingpass/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const msg = `Failed to download boarding pass: ${res.status} ${text}`;
        setAlert(msg);
        setToastMsg(msg);
        setToastType('error');
        setToastOpen(true);
        setTimeout(() => setAlert(''), 4000);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      let filename = `boardingpass_${id}.pdf`;
      const m = disposition.match(/filename\*?=([^;]+)/);
      if (m) {
        filename = m[1].replace(/(^\s*"|"\s*$)/g, '');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      const msg = 'Boarding pass downloaded.';
      setAlert(msg);
      setToastMsg(msg);
      setToastType('success');
      setToastOpen(true);
      setTimeout(() => setAlert(''), 3000);
    } catch (err) {
      console.error('download boarding pass error', err);
      const msg = 'Failed to download boarding pass.';
      setAlert(msg);
      setToastMsg(msg);
      setToastType('error');
      setToastOpen(true);
      setTimeout(() => setAlert(''), 3000);
    } finally {
      setDownloading(null);
    }
  }

  // Download boarding pass as PDF (saves file locally)
  async function downloadBoardingPass(booking) {
    const id = booking.BookingId || booking.id || booking.bookingId || booking.BookingId;
    if (!id) {
      const msg = 'Booking id missing for this record.';
      setAlert(msg);
      setToastMsg(msg);
      setToastType('error');
      setToastOpen(true);
      setTimeout(() => setAlert(''), 3000);
      return;
    }

    setDownloading(id);
    try {
      const res = await fetch(`http://localhost:4000/api/bookings/boardingpass/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const msg = `Failed to download boarding pass: ${res.status} ${text}`;
        setAlert(msg);
        setToastMsg(msg);
        setToastType('error');
        setToastOpen(true);
        setTimeout(() => setAlert(''), 4000);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      let filename = `boardingpass_${id}.pdf`;
      const m = disposition.match(/filename\*?=([^;]+)/);
      if (m) {
        filename = m[1].replace(/(^\s*"|"\s*$)/g, '');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      const msg = 'Boarding pass downloaded.';
      setAlert(msg);
      setToastMsg(msg);
      setToastType('success');
      setToastOpen(true);
      setTimeout(() => setAlert(''), 3000);
    } catch (err) {
      console.error('download boarding pass error', err);
      const msg = 'Failed to download boarding pass.';
      setAlert(msg);
      setToastMsg(msg);
      setToastType('error');
      setToastOpen(true);
      setTimeout(() => setAlert(''), 3000);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="bh-root">
      <CustomerNavbar />
      {/* ⭐ TOP ALERT TOASTER */}
      <Popup open={toastOpen} message={toastMsg || alert} type={toastType} onClose={() => { setToastOpen(false); setToastMsg(''); setAlert(''); }} />

      <div className="bh-container">
        <h2 style={{"color":"black"}}>Your Booking History</h2>

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
                  <th>Origin</th>
                  <th>Destination</th>
                  <th>Boarding Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Invoice</th>
                  {/* <th>Boarding Pass</th> */}
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {console.log(bookings)}
                {bookings.map((b) => (
                  <tr key={b.BookingId}>
                    <td>
                      <button
                        onClick={() => setSelectedBooking(b)}
                        style={{ background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                      >
                        
                      <button
                        onClick={() => setSelectedBooking(b)}
                        style={{ background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                      >
                        {b.BookingId || b.id}
                      </button>
                    
                      </button>
                    </td>
                    <td>{b.flightNumber}</td>
                    <td>
                      {Array.isArray(b.passengers) && b.passengers.length > 0
                        ? b.passengers.map(p => p.name || p.fullName || (typeof p === 'string' ? p : JSON.stringify(p))).join(', ')
                        : (b.Quantity || b.user?.name || '-')}
                    </td>
                    <td>{b.origin || b.from}</td>
                    <td>{b.destination || b.to}</td>
                    <td>
                      {b.departure || b.travelDate
                        ? new Date(b.departure || b.travelDate).toLocaleString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12:true
                            }
                          ).toLocaleUpperCase()
                        : "-"}
                    </td>
                    <td>₹{b.PricePaid.finalPrice || b.PricePaid}</td>

                    {/* ⭐ STATUS updated to grey when cancelled */}
                    <td>
                      <div
                        style={{
                          color: b.BookingStatus !== "BOOKED" ? "red" : "green",
                          fontWeight: 600,
                        }}
                      >
                        {b.BookingStatus}
                      </div>
                    </td>

                    <td>
                      {b.BookingStatus !== "BOOKED" ? (
                        <div style={{ fontWeight: 600, color: "#6b7280" }}>Booking Cancelled</div>
                      ) : (
                        <button
                          className="logout-btn"
                          onClick={() => downloadBoardingPass(b)}
                          disabled={!(b.BookingId || b.id || b.bookingId) || downloading === (b.BookingId || b.id || b.bookingId)}
                        >
                          {downloading === (b.BookingId || b.id || b.bookingId) ? 'Downloading...' : 'Download'}
                        </button>
                      )}
                    </td>

                    <td>
                      {b.BookingStatus !== "BOOKED" ? (
                        <div style={{ fontWeight: 600, color: 'blue' }}>
                          {`Refunded: ₹${b.RefundAmount ?? b.refundAmount ?? b.refund}`}
                        </div>
                      ) : (
                        (() => {
                          const raw = b.departure || b.travelDate || b.date || b.Departure || b.TravelDate;
                          const dep = raw ? new Date(String(raw).replace(' ', 'T')) : null;
                          const departed = dep && !isNaN(dep.getTime()) && Date.now() > dep.getTime();
                          if (departed) {
                            return <div style={{ fontWeight: 600, color: '#6b7280' }}>Flight has already departed</div>;
                          }

                          return (
                            <button
                              className="logout-btn"
                              disabled={b.cancelled}
                              onClick={() => handleCancel(b.PNR, b.BookingId, b.RefundAmount)}
                              style={{
                                background: "white",
                                color: "red",
                                border: "2px solid red",
                                opacity: b.cancelled ? 0.5 : 1,
                                cursor: b.cancelled ? "not-allowed" : "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          );
                        })()
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

              {/* Booking details modal */}
              {selectedBooking && (
                <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setSelectedBooking(null)} />
                  <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 12px 40px rgba(2,6,23,0.2)', width: '90%', maxWidth: 760, zIndex: 10002, maxHeight: '80%', overflowY: 'auto' }}>
                    <h3 style={{ marginTop: 0 }}>Booking Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div><strong>Booking ID</strong><div>{selectedBooking.BookingId || selectedBooking.id || selectedBooking.bookingId}</div></div>
                      <div><strong>PNR</strong><div>{selectedBooking.PNR || selectedBooking.pnr || '-'}</div></div>
                      <div><strong>Flight</strong><div>{selectedBooking.flightNumber || selectedBooking.flight || '-'}</div></div>
                      <div><strong>Passengers</strong><div>{Array.isArray(selectedBooking.passengers) ? selectedBooking.passengers.map(p => p.name || p.fullName || JSON.stringify(p)).join(', ') : (selectedBooking.passengers || selectedBooking.user?.name || '-')}</div></div>
                      <div><strong>Seat Type</strong><div>{selectedBooking.type || selectedBooking.seatType || '-'}</div></div>
                      <div><strong>Quantity</strong><div>{selectedBooking.quantity || selectedBooking.Quantity || '-'}</div></div>
                      <div><strong>Price Paid</strong><div>₹{selectedBooking.PricePaid.finalPrice ?? selectedBooking.price ?? selectedBooking.pricePaid ?? '-'}</div></div>
                      <div><strong>Refund</strong><div>₹{selectedBooking.RefundAmount ?? selectedBooking.refundAmount ?? selectedBooking.Refund ?? 0}</div></div>
                      <div><strong>From</strong><div>{selectedBooking.origin || selectedBooking.from || '-'}</div></div>
                      <div><strong>To</strong><div>{selectedBooking.destination || selectedBooking.to || '-'}</div></div>
                      <div><strong>Departure</strong><div>{selectedBooking.departure || selectedBooking.travelDate || selectedBooking.date ? new Date(selectedBooking.departure || selectedBooking.travelDate || selectedBooking.date).toLocaleString('en-IN') : '-'}</div></div>
                      <div><strong>Booked At</strong><div>{selectedBooking.BookedAt || selectedBooking.bookedAt || selectedBooking.createdAt ? new Date(selectedBooking.BookedAt || selectedBooking.bookedAt || selectedBooking.createdAt).toLocaleString('en-IN') : '-'}</div></div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <strong>Status</strong>
                        <div style={{ marginTop: 6, fontWeight: 700, color: selectedBooking.BookingStatus !== "BOOKED" ? 'red' : 'green' }}>{selectedBooking.BookingStatus}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                      <button onClick={() => setSelectedBooking(null)} style={{ padding: '8px 12px', borderRadius: 6 }}>Close</button>
                      {selectedBooking.BookingStatus === 'BOOKED' && (selectedBooking.BookingId || selectedBooking.id || selectedBooking.bookingId) && (
                        <button onClick={() => downloadBoardingPass(selectedBooking)} style={{ padding: '8px 12px', borderRadius: 6, background: '#1a73e8', color: '#fff', border: 'none' }}>Download Boarding Pass</button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Booking details modal
              {selectedBooking && (
                <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setSelectedBooking(null)} />
                  <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 12px 40px rgba(2,6,23,0.2)', width: '90%', maxWidth: 760, zIndex: 10002, maxHeight: '80%', overflowY: 'auto' }}>
                    <h3 style={{ marginTop: 0 }}>Booking Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div><strong>Booking ID</strong><div>{selectedBooking.BookingId || selectedBooking.id || selectedBooking.bookingId}</div></div>
                      <div><strong>PNR</strong><div>{selectedBooking.PNR || selectedBooking.pnr || '-'}</div></div>
                      <div><strong>Flight</strong><div>{selectedBooking.flightNumber || selectedBooking.flight || '-'}</div></div>
                      <div><strong>Passengers</strong><div>{Array.isArray(selectedBooking.passengers) ? selectedBooking.passengers.map(p => p.name || p.fullName || JSON.stringify(p)).join(', ') : (selectedBooking.passengers || selectedBooking.user?.name || '-')}</div></div>
                      <div><strong>Seat Type</strong><div>{selectedBooking.type || selectedBooking.seatType || '-'}</div></div>
                      <div><strong>No. of Passengers</strong><div>{selectedBooking.quantity || selectedBooking.Quantity || '-'}</div></div>
                      <div><strong>Price Paid</strong><div>₹{selectedBooking.PricePaid.finalPrice ?? selectedBooking.PricePaid ?? selectedBooking.pricePaid ?? '-'}</div></div>
                      <div><strong>Refund</strong><div>₹{selectedBooking.RefundAmount ?? selectedBooking.refundAmount ?? selectedBooking.Refund ?? 0}</div></div>
                      <div><strong>From</strong><div>{selectedBooking.origin || selectedBooking.from || '-'}</div></div>
                      <div><strong>To</strong><div>{selectedBooking.destination || selectedBooking.to || '-'}</div></div>
                      <div><strong>Departure</strong><div>{selectedBooking.departure || selectedBooking.travelDate || selectedBooking.date ? new Date(selectedBooking.departure || selectedBooking.travelDate || selectedBooking.date).toLocaleString('en-IN') : '-'}</div></div>
                      <div><strong>Booked At</strong><div>{selectedBooking.BookedAt || selectedBooking.bookedAt || selectedBooking.createdAt ? new Date(selectedBooking.BookedAt || selectedBooking.bookedAt || selectedBooking.createdAt).toLocaleString('en-IN') : '-'}</div></div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <strong>Status</strong>
                        <div style={{ marginTop: 6, fontWeight: 700, color: selectedBooking.BookingStatus !== ('Booked' || "BOOKED") ? 'red' : 'green' }}>{selectedBooking.BookingStatus}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                      <button onClick={() => setSelectedBooking(null)} style={{ padding: '8px 12px', borderRadius: 6 }}>Close</button>
                      {selectedBooking.BookingStatus === 'Booked' && (selectedBooking.BookingId || selectedBooking.id || selectedBooking.bookingId) && (
                        <button onClick={() => downloadBoardingPass(selectedBooking)} style={{ padding: '8px 12px', borderRadius: 6, background: '#1a73e8', color: '#fff', border: 'none' }}>Download Boarding Pass</button>
                      )}
                    </div>
                  </div>
                </div>
              )} */}

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
