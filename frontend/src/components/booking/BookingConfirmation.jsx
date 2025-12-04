import React from "react";
import Button from "../common/Button";

const BookingConfirmation = ({ bookingId, flightId, passengerName, onBackToHome }) => {
  return (
    <div style={{ textAlign: "center", padding: 24 }}>
      <h2 style={{ color: "#0A3D62" }}>Booking Confirmed</h2>
      <p style={{ marginTop: 6 }}>Booking ID: <strong>{bookingId}</strong></p>
      <p>{passengerName} — Flight <strong>{flightId}</strong></p>

      <div style={{ marginTop: 18 }}>
        <Button title="Back to Home" onClick={onBackToHome} />
      </div>
    </div>
  );
};

export default BookingConfirmation;