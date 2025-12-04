import React from "react";
import InputField from "../common/InputField";

const PassengerForm = ({ passenger, onChange }) => {
  return (
    <div style={{ background: "white", padding: 16, borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Passenger Details</h3>

      <InputField
        label="Full name"
        value={passenger.name}
        onChange={(val) => onChange({ ...passenger, name: val })}
        placeholder="e.g., Akash Kumar"
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6 }}>Age</label>
          <input
            type="number"
            value={passenger.age === undefined ? "" : String(passenger.age)}
            onChange={(e) => onChange({ ...passenger, age: Number(e.target.value) })}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
            min={0}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>Gender</label>
          <select
            value={passenger.gender || ""}
            onChange={(e) => onChange({ ...passenger, gender: e.target.value })}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <InputField
        label="Email (optional)"
        value={passenger.email || ""}
        onChange={(val) => onChange({ ...passenger, email: val })}
        placeholder="you@example.com"
      />

      <InputField
        label="Phone (optional)"
        value={passenger.phone || ""}
        onChange={(val) => onChange({ ...passenger, phone: val })}
        placeholder="+91-XXXXXXXXXX"
      />
    </div>
  );
};

export default PassengerForm;