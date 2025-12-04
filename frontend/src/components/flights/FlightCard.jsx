import React from "react";
import Button from "../common/Button";
import { useNavigate } from "react-router-dom";

const FlightCard = ({ flight }) => {
  const navigate = useNavigate();

  const handleBook = () => {
    const params = new URLSearchParams({
      flightId: flight.id,
      from: flight.from,
      to: flight.to,
      dep: flight.departureTime,
      arr: flight.arrivalTime,
      price: String(flight.price),
    }).toString();
    navigate(`/booking?${params}`);
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      background: "white",
      borderRadius: 8,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
    }}>
      <div>
        <div style={{ fontWeight: 700 }}>{flight.airline} — {flight.id}</div>
        <div style={{ color: "#444" }}>{flight.from} → {flight.to}</div>
        <div style={{ color: "#666", fontSize: 13 }}>
          {new Date(flight.departureTime).toLocaleString()} — {new Date(flight.arrivalTime).toLocaleString()}
        </div>
        <div style={{ color: "#888", fontSize: 13 }}>{flight.seatsAvailable} seats left</div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>₹{flight.price}</div>
        <div style={{ marginTop: 8 }}>
          <Button title="Book" onClick={handleBook} />
        </div>
      </div>
    </div>
  );
};

export default FlightCard;