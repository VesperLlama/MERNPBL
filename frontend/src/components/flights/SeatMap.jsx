import React, { useState } from "react";

const SeatMap = ({ rows = 6, cols = 6, onSelect }) => {
  const [selected, setSelected] = useState(null);

  const handle = (r, c) => {
    const seat = `${String.fromCharCode(65 + r)}${c + 1}`;
    setSelected(seat);
    onSelect?.(seat);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const seat = `${String.fromCharCode(65 + r)}${c + 1}`;
          const isSelected = selected === seat;
          return (
            <button
              key={seat}
              onClick={() => handle(r, c)}
              style={{
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ddd",
                background: isSelected ? "#0A3D62" : "#fff",
                color: isSelected ? "white" : "#333",
                cursor: "pointer"
              }}
            >
              {seat}
            </button>
          );
        })
      )}
    </div>
  );
};

export default SeatMap;