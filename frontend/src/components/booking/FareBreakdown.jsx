import React from "react";

const FareBreakdown = ({ baseFare = 0, taxes = 0, fees = 0, discount = 0 }) => {
  const subtotal = baseFare + taxes + fees;
  const total = Math.max(0, subtotal - discount);

  return (
    <div style={{ background: "white", padding: 16, borderRadius: 8 }}>
      <h4 style={{ marginTop: 0 }}>Fare Breakdown</h4>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Base Fare</span>
          <span>₹{baseFare}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Taxes</span>
          <span>₹{taxes}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Fees</span>
          <span>₹{fees}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>

        {discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", color: "green" }}>
            <span>Discount</span>
            <span>- ₹{discount}</span>
          </div>
        )}

        <hr />

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 }}>
          <strong>Total</strong>
          <strong>₹{total}</strong>
        </div>
      </div>
    </div>
  );
};

export default FareBreakdown;