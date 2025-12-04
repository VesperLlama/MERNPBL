import React from "react";
import Button from "../common/Button";

const FlightDetails = ({ flight, onClose, onBook }) => {
  if (!flight) return null;

  return (
    <div style={{ background: "white", padding: 16, borderRadius: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <h3 style={{ margin: 0 }}>{flight.airline} — {flight.id}</h3>
          <div style={{ color: "#666" }}>{flight.from} → {flight.to}</div>
          <div style={{ color: "#666", marginTop: 6 }}>
            Dep: {new Date(flight.departureTime).toLocaleString()}
            <br />
            Arr: {new Date(flight.arrivalTime).toLocaleString()}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>₹{flight.price}</div>
          <div style={{ marginTop: 10 }}>
            <Button title="Book" onClick={() => onBook?.(flight)} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Seats available:</strong> {flight.seatsAvailable}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        {onClose && <Button title="Close" onClick={onClose} style={{ background: "#888" }} />}
      </div>
    </div>
  );
};

export default FlightDetails;