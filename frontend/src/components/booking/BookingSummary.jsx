import React from "react";

const BookingSummary = ({ flight, passenger, totalAmount }) => {
  if (!flight) return null;

  return (
    <div style={{ background: "white", padding: 16, borderRadius: 8 }}>
      <h4 style={{ marginTop: 0 }}>Booking Summary</h4>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>{flight.airline} — {flight.id}</div>
        <div>{flight.from} → {flight.to}</div>
        <div style={{ color: "#666" }}>
          {new Date(flight.departureTime).toLocaleString()} → {new Date(flight.arrivalTime).toLocaleString()}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #eee", paddingTop: 10 }}>
        <div><strong>Passenger:</strong> {passenger.name || "—" } {passenger.age ? `(${passenger.age})` : ""}</div>
        {passenger.email && <div><strong>Email:</strong> {passenger.email}</div>}
        {passenger.phone && <div><strong>Phone:</strong> {passenger.phone}</div>}
      </div>

      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 18 }}>
        <strong>Total Payable</strong>
        <strong>₹{totalAmount}</strong>
      </div>
    </div>
  );
};

export default BookingSummary;