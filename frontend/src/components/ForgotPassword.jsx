import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const loginEmail = location.state?.loginEmail || "";
  const [email, setEmail] = useState(loginEmail);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    console.log("VERIFY CLICKED");

    // Check 1: email must match login page email
    console.log("Login Email:", loginEmail);
    console.log("Entered Email:", email);

    if (email.trim().toLowerCase() !== loginEmail.trim().toLowerCase()) {
      setError("Email does not match the login email.");
      console.log("Email mismatch!");
      return;
    }

    console.log("Email matches login email. Now checking DB...");

    // Check 2: check if email exists in DB
    try {
      const res = await fetch(
        "http://localhost:4000/api/customers/check-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();
      console.log("Backend Response:", data);

      if (!res.ok) {
        setError(data.message);
        return;
      }

      console.log("Email verified, navigating to reset-password...");
      navigate("/reset-password", { state: { email } });
    } catch (error) {
      console.log("ERROR calling backend:", error);
      setError("Server error. Try again.");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", padding: 20 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          padding: "6px 14px",
          border: "2px solid #333",
          borderRadius: "6px",
          background: "white",
          color: "#333",
          fontSize: "15px",
          cursor: "pointer",
          fontWeight: "500",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          zIndex: 1000,
        }}
      >
        ← Back
      </button>
      <h2>Forgot Password</h2>
      <p>Confirm your email to proceed.</p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
            marginBottom: 10,
          }}
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
            border: "none",
          }}
        >
          Verify Email
        </button>
      </form>
    </div>
  );
}
