// import React, { useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import "./login.css";

// export default function CustomerLogin() {
//   const location = useLocation();
//   const fromAdmin = !!(
//     location &&
//     location.state &&
//     location.state.fromAdmin === true
//   );
//   const isAdmin = fromAdmin || localStorage.getItem("isAdmin") === "true";
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   function handleSubmit(e) {
//     e.preventDefault();
//     const data = { EmailId: email, Password: password, isAdmin: isAdmin };

//     fetch("http://localhost:4000/api/auth/login", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(data),
//     })  
//       .then((res) => {
//         if (res.status === 401) {
//           throw new Error(res.json().message);
//         }
//         return res.json();
//       })
//       .then((res) => {
//         localStorage.setItem("user", JSON.stringify(res.user));
//         localStorage.setItem("token", res.token);
//         if (isAdmin) {
//           navigate("/admin");
//         } else {
//           navigate("/dashboard");
//         }
//       })
//       .catch({});
//   }

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         background: "#f7fafc",
//       }}
//     >
//       <div
//         style={{
//           width: "100%",
//           maxWidth: 520,
//           background: "#fff",
//           padding: 28,
//           borderRadius: 10,
//           boxShadow: "0 6px 20px rgba(2,6,23,0.08)",
//         }}
//       >
//         <h2 style={{ margin: 0, marginBottom: 12 }}>
//           {isAdmin ? "Admin Login" : "Customer Login"}
//         </h2>
//         <p style={{ marginTop: 0, marginBottom: 18, color: "#6b7280" }}>
//           Enter your credentials to sign in.
//         </p>
//         <form onSubmit={handleSubmit}>
//           <label
//             style={{ display: "block", marginBottom: 6, color: "#6b7280" }}
//           >
//             Email
//           </label>
//           <input
//           required
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             type="email"
//             name="email"
//             style={{
//               width: "100%",
//               padding: "10px 8px",
//               borderRadius: 6,
//               border: "1px solid #e6e9ee",
//               marginBottom: 12,
//             }}
//           />
//           <label
//             style={{ display: "block", marginBottom: 6, color: "#6b7280" }}
//           >
//             Password
//           </label>
//           <input
//           required
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             type="password"
//             name="password"
//             style={{
//               width: "100%",
//               padding: "10px 8px",
//               borderRadius: 6,
//               border: "1px solid #e6e9ee",
//               marginBottom: 14,
//             }}
//           />
//           <div
//             style={{
//               display: "flex",
//               gap: 12,
//               justifyContent: "space-between",
//               alignItems: "center",
//             }}
//           >
//             <button
//               type="submit"
//               style={{
//                 background: "#0ea5a4",
//                 color: "#fff",
//                 padding: "10px 14px",
//                 borderRadius: 8,
//                 border: "none",
//                 fontWeight: 600,
//               }}
//             >
//               Sign in
//             </button>
//             {!isAdmin && (
//               <a
//                 href="/register"
//                 style={{ color: "#0ea5a4", textDecoration: "none" }}
//               >
//                 Create an account
//               </a>
//             )}
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
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

  // New error states
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
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

    const data = { EmailId: email, Password: password, isAdmin: isAdmin };

    fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(async (res) => {
        // try to parse JSON body if present
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          // prefer server message, fall back to generic
          const msg = (payload && (payload.message || payload.error)) || `Request failed: ${res.status}`;
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
        // show a friendly message
        const msg = err && err.message ? err.message : "Login failed";
        // Normalize common auth message
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
          <label style={{ display: "block", marginBottom: 6, color: "#6b7280" }}>
            Email
          </label>

          <input
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setServerError(""); }}
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

          {serverError && <p className="error-text">{serverError}</p>}

          <label style={{ display: "block", marginBottom: 6, color: "#6b7280" }}>
            Password
          </label>

          <div className="password-wrapper">
            <input
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setServerError(""); }}
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

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 14,
            }}
          >
            <button
              type="submit"
              style={{
                background: "#0ea5a4",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                fontWeight: 600,
              }}
            >
              Sign in
            </button>

            {!isAdmin && (
              <a
                href="/register"
                style={{ color: "#0ea5a4", textDecoration: "none" }}
              >
                Create an account
              </a>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
