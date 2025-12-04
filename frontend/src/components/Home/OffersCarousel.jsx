import React from "react";

const OffersCarousel = () => {
  // Simple static banners; replace with dynamic data later if needed
  const banners = [
    { id: 1, title: "Flat 20% off on Domestic Flights — Use code FLY20" },
    { id: 2, title: "Student discounts available — Verify student ID" },
    { id: 3, title: "Early-bird savings: Book 30+ days in advance" },
  ];

  return (
    <div style={{ width: "100%", marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          padding: 12,
        }}
      >
        {banners.map((b) => (
          <div
            key={b.id}
            style={{
              minWidth: 280,
              padding: 16,
              borderRadius: 10,
              background: "#0A3D62",
              color: "white",
              boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontWeight: 700 }}>{b.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OffersCarousel;