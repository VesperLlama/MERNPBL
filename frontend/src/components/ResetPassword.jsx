import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const { state } = useLocation();
  const email = state?.email;

  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (newPass !== confirm) {
      setError("Passwords do not match");
      return;
    }

    const res = await fetch("http://localhost:4000/api/customers/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword: newPass })
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Error resetting password");
      return;
    }

    alert("Password updated successfully!");

    navigate("/"); // Landing page
  }

  return (
    <div style={{ maxWidth: 420, margin: "100px auto", padding: 20 }}>
      <h2>Reset Password</h2>
      <p>Enter your new password below for {email}</p>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New Password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          required
          style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc", marginBottom: 12 }}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc", marginBottom: 12 }}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: 10,
            background: "#0ea5a4",
            color: "#fff",
            borderRadius: 6,
            border: "none"
          }}
        >
          Update Password
        </button>
      </form>
    </div>
  );
}