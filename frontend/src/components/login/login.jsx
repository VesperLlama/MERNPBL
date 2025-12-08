import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./login.css";

export default function CustomerLogin() {
  const location = useLocation();
  const fromAdmin = !!(
    location &&
    location.state &&
    location.state.fromAdmin === true
  );
  const isAdmin = fromAdmin || localStorage.getItem("isAdmin") === "true";
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({ email: "", password: "" });
  const [serverError, setServerError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {
      email: email ? "" : "Email is required",
      password: password ? "" : "Password is required",
    };
    setErrors(newErrors);

    if (!email || !password) return; // stop submit
    setServerError("");

    const data = { EmailId: email, Password: password, isAdmin };

    fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => null);

        if (!res.ok) {
          const msg =
            (payload && (payload.message || payload.error)) ||
            `Request failed: ${res.status}`;
          throw new Error(msg);
        }
        return payload;
      })
      .then((resBody) => {
        localStorage.setItem("user", JSON.stringify(resBody.user));
        localStorage.setItem("token", resBody.token);
        navigate(isAdmin ? "/admin" : "/dashboard");
      })
      .catch((err) => {
        const msg = err?.message || "Login failed";

        if (/invalid|incorrect|expired|unauthor/i.test(msg)) {
          setServerError("Invalid email or password");
        } else {
          setServerError(msg);
        }
      });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7fafc",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          padding: 28,
          borderRadius: 10,
          boxShadow: "0 6px 20px rgba(2,6,23,0.08)",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 12 }}>
          {isAdmin ? "Admin Login" : "Customer Login"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <label style={{ display: "block", marginBottom: 6, color: "#6b7280" }}>
            Email
          </label>

          <input
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setServerError("");
            }}
            type="email"
            name="email"
            style={{
              width: "100%",
              padding: "10px 8px",
              borderRadius: 6,
              border: "1px solid #e6e9ee",
              marginBottom: 6,
            }}
          />

          {errors.email && <p className="error-text">{errors.email}</p>}

          {/* Password */}
          <label style={{ display: "block", marginBottom: 6, color: "#6b7280" }}>
            Password
          </label>

          <div className="password-wrapper">
            <input
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setServerError("");
              }}
              type={showPassword ? "text" : "password"}
              name="password"
              className="password-input"
            />

            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🔒" : "🔓"}
            </span>
          </div>

          {errors.password && <p className="error-text">{errors.password}</p>}
          {serverError && <p className="error-text">{serverError}</p>}

          {/* Buttons Section */}
          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            {/* LEFT SIDE → Sign In + Forgot Password */}
            <div style={{ textAlign: "left" }}>
              {/* Sign In button */}
              <button
                type="submit"
                style={{
                  background: "#0ea5a4",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: 600,
                  width: "140px",
                }}
              >
                Sign in
              </button>

              {/* Forgot password */}
              {!isAdmin && (
                <p
                  onClick={() => {
                    if (!email) {
                      setServerError("Enter your email before clicking Forgot Password.");
                      return;
                    }
                    navigate("/forgot-password", { state: { loginEmail: email } });
                  }}
                  style={{
                    marginTop: 8,
                    color: "#0ea5a4",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Forgot Password?
                </p>
              )}
            </div>

            {/* RIGHT SIDE → Create Account */}
            {!isAdmin && (
              <div style={{ textAlign: "right" }}>
                <a
                  href="/register"
                  style={{
                    color: "#0ea5a4",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Create an account
                </a>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}