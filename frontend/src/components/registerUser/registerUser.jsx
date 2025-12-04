import React, { useEffect, useState } from "react";
import "./registerUser.css";

const cities = [
  { name: "Mumbai", state: "Maharashtra", zip: "400001" },
  { name: "Delhi", state: "Delhi", zip: "110001" },
  { name: "Bengaluru", state: "Karnataka", zip: "560001" },
  { name: "Chennai", state: "Tamil Nadu", zip: "600001" },
  { name: "Kolkata", state: "West Bengal", zip: "700001" }
];

// VALIDATIONS
const fullnameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const phoneRegex = /^[6-9]\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterUser() {
  const [form, setForm] = useState({
    fullName: "",
    password: "",
    confirmPassword: "",
    phone: "",
    email: "",
    address1: "",
    address2: "",
    city: cities[0].name,
    state: cities[0].state,
    zip: cities[0].zip,
    dob: "",
    estimatedSpend: ""
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [role, setRole] = useState("Customer");
  const [customerCategory, setCustomerCategory] = useState("Silver");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    setRole(isAdmin ? "Admin" : "Customer");
  }, []);

  useEffect(() => {
    const spend = parseFloat(form.estimatedSpend) || 0;
    if (spend >= 1000000) setCustomerCategory("Platinum");
    else if (spend >= 500000) setCustomerCategory("Gold");
    else setCustomerCategory("Silver");
  }, [form.estimatedSpend]);

  function validate() {
    const e = {};

    if (!fullnameRegex.test(form.fullName))
      e.fullName = "Enter valid name (letters only, single spaces allowed)";

    if (!passwordRegex.test(form.password))
      e.password =
        "Password must be 8+ chars and include upper, lower, number & special char";

    if (!form.confirmPassword) e.confirmPassword = "Confirm password is required";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";

    if (!phoneRegex.test(form.phone))
      e.phone = "Phone must be 10 digits, starting with 6–9";

    if (!emailRegex.test(form.email)) e.email = "Enter a valid email address";

    if (!form.address1) e.address1 = "Address Line 1 is required";

    // DOB validation
    if (!form.dob) e.dob = "Date of birth is required";
    else {
      const dobDate = new Date(form.dob);
      const min = new Date("1930-01-01");
      const now = new Date();
      const max = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());

      if (dobDate < min || dobDate > max)
        e.dob = "Must be 18+ years old & born after 01/01/1930";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateField(name) {
    const e = { ...errors };
    // helper to set or remove error for a single field
    const setErr = (key, msg) => {
      if (msg) e[key] = msg;
      else delete e[key];
    };

    const v = form[name];
    switch (name) {
      case "fullName":
        setErr(
          "fullName",
          !fullnameRegex.test(v) ? "Enter valid name (letters only, single spaces allowed)" : null
        );
        break;
      case "password":
        setErr(
          "password",
          !passwordRegex.test(v) ? "Password must be 8+ chars and include upper, lower, number & special char" : null
        );
        // also re-validate confirmPassword when password changes
        if (touched.confirmPassword || submitted) validateField("confirmPassword");
        break;
      case "confirmPassword":
        if (!v) setErr("confirmPassword", "Confirm password is required");
        else if (v !== form.password) setErr("confirmPassword", "Passwords do not match");
        else setErr("confirmPassword", null);
        break;
      case "phone":
        setErr("phone", !phoneRegex.test(v) ? "Phone must be 10 digits, starting with 6–9" : null);
        break;
      case "email":
        setErr("email", !emailRegex.test(v) ? "Enter a valid email address" : null);
        break;
      case "address1":
        setErr("address1", !v ? "Address Line 1 is required" : null);
        break;
      case "dob":
        if (!v) setErr("dob", "Date of birth is required");
        else {
          const dobDate = new Date(v);
          const min = new Date("1930-01-01");
          const now = new Date();
          const max = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
          setErr("dob", dobDate < min || dobDate > max ? "Must be 18+ years old & born after 01/01/1930" : null);
        }
        break;
      case "zip":
        // pincode must be 6 digits and first digit 1-9 (no leading zero)
        setErr("zip", !/^[1-9][0-9]{5}$/.test(v) ? "Pincode must be 6 digits and start with 1-9" : null);
        break;
      default:
        break;
    }

    setErrors(e);
  }

  async function handlePincodeLookup(zip) {
    if (!/^[1-9][0-9]{5}$/.test(zip)) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${zip}`);
      const json = await res.json();
      if (!Array.isArray(json) || json.length === 0) return;
      const entry = json[0];
      if (entry.Status !== "Success" || !entry.PostOffice || entry.PostOffice.length === 0) {
        // No records found - show invalid indication in city/state
        setForm((f) => ({ ...f, city: "Invalid Pincode", state: "Invalid Pincode", zip }));
        setErrors((e) => ({ ...e, zip: "Invalid Pincode" }));
        return;
      }
      // choose first PostOffice
      const po = entry.PostOffice[0];
      // Autofill district as city and state
      setForm((f) => ({ ...f, city: po.District || po.Name || f.city, state: po.State || f.state, zip }));
      // clear any zip error
      setErrors((e) => {
        const ne = { ...e };
        delete ne.zip;
        return ne;
      });
    } catch (err) {
      // ignore network errors, leave zip as entered
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "city") {
      const cityObj = cities.find((c) => c.name === value);
      setForm((f) => ({
        ...f,
        city: value,
        state: cityObj ? cityObj.state : f.state,
        zip: cityObj ? cityObj.zip : f.zip
      }));
      return;
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
      // live-validate on change for touched fields
      if (touched[name]) validateField(name);
    }
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    validateField(name);
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setSubmitted(true);
    if (!validate()) return;

    setSubmitting(true);
    setServerError("");
    const { confirmPassword, ...payloadData } = form;

    // Map frontend form keys to backend expected keys
    const payload = {
      FullName: payloadData.fullName,
      Password: payloadData.password,
      Phone: payloadData.phone,
      EmailId: payloadData.email,
      AddressLine1: payloadData.address1,
      AddressLine2: payloadData.address2 || '',
      City: payloadData.city,
      State: payloadData.state,
      ZipCode: payloadData.zip,
      DOB: payloadData.dob,
      CustomerCategory: customerCategory
    };

    try {
      const res = await fetch("http://localhost:4000/api/customers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resBody = await res.json().catch(() => null);
      if (res.ok) {
        const id = resBody?.CustomerId || resBody?.customerId || resBody?.id || resBody?.CustomerID;
        // popup with clear message to note the ID
        if (id) {
          alert(`Registration successful!\nYour Customer ID: ${id}\nPlease note this ID for future reference.`);
        } else {
          alert('Registration successful!');
        }
        // optionally reset form
        setForm({
          fullName: "",
          password: "",
          confirmPassword: "",
          phone: "",
          email: "",
          address1: "",
          address2: "",
          city: cities[0].name,
          state: cities[0].state,
          zip: cities[0].zip,
          dob: "",
          estimatedSpend: ""
        });
      } else {
        // show meaningful server error(s)
        if (resBody) {
          if (Array.isArray(resBody.errors) && resBody.errors.length > 0) {
            setServerError(resBody.errors.join('; '));
          } else if (resBody.message) {
            setServerError(resBody.message);
          } else {
            setServerError('Registration failed: Server validation error');
          }
        } else {
          setServerError('Registration failed: Server error');
        }
      }
    } catch (err) {
      setServerError('Registration failed: ' + (err.message || 'Network error'));
    } finally {
      setSubmitting(false);
    }
  }

  const minDob = "1930-01-01";
  const today = new Date();
  const maxDob = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .slice(0, 10);

  return (
    <div className="register-page">
      <div className="register-card">
        <h2>Create Account</h2>
        <p className="required-note">
          Fields marked <span className="req">*</span> are required
        </p>

        {serverError && (
          <div className="server-error" style={{ color: 'red', marginBottom: 12 }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3">
          <div className="row g-3">
            {/* FULL NAME */}
            <div className="col-md-6"><br />
              <label className="required">Full Name</label>
              <input
                className="form-control"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter full name"
              />
              {errors.fullName && (touched.fullName || submitted) && <div className="error">{errors.fullName}</div>}
            </div>

            {/* EMAIL */}
            <div className="col-md-6"><br />
              <label className="required">Email</label>
              <input
                className="form-control"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@example.com"
              />
              {errors.email && (touched.email || submitted) && <div className="error">{errors.email}</div>}
            </div>

            {/* PASSWORD */}
            <div className="col-md-6">
              <label className="required">Password</label>
              <input
                className="form-control"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Strong password"
              />
              {errors.password && (touched.password || submitted) && <div className="error">{errors.password}</div>}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="col-md-6">
              <label className="required">Confirm Password</label>
              <input
                className="form-control"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Re-enter password"
              />
              {errors.confirmPassword && (touched.confirmPassword || submitted) && (
                <div className="error">{errors.confirmPassword}</div>
              )}
            </div>

            {/* PHONE */}
            <div className="col-md-6">
              <label className="required">Phone</label>
              <input
                className="form-control"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="10 digit number"
              />
              {errors.phone && (touched.phone || submitted) && <div className="error">{errors.phone}</div>}
            </div>

            {/* DOB */}
            <div className="col-md-6">
              <label className="required">Date of Birth</label>
              <input
                className="form-control"
                name="dob"
                type="date"
                value={form.dob}
                onChange={handleChange}
                onBlur={handleBlur}
                min={minDob}
                max={maxDob}
              />
              {errors.dob && (touched.dob || submitted) && <div className="error">{errors.dob}</div>}
            </div>

            {/* SPEND */}
            <div className="col-md-6">
              <label className="required">Estimated Spend on Flights (INR)</label>
              <input
                className="form-control"
                name="estimatedSpend"
                value={form.estimatedSpend}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. 20000"
              />
              <div className="small-text">Category: {customerCategory}</div>
            </div>

            {/* ADDRESS 1 */}
            <div className="col-12">
              <label className="required">Address Line 1</label>
              <input
                className="form-control"
                name="address1"
                value={form.address1}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.address1 && (touched.address1 || submitted) && <div className="error">{errors.address1}</div>}
            </div>

            {/* ADDRESS 2 */}
            <div className="col-12">
              <label>Address Line 2 (optional)</label>
              <input
                className="form-control"
                name="address2"
                value={form.address2}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>

            {/* PINCODE (Zip) */}
            <div className="col-md-4">
              <label className="required">Pincode</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="form-control"
                  name="zip"
                  value={form.zip}
                  onChange={handleChange}
                  onBlur={(e) => {
                    handleBlur(e);
                    // if valid, lookup
                    const v = e.target.value || "";
                    if (/^[1-9][0-9]{5}$/.test(v)) handlePincodeLookup(v);
                  }}
                  placeholder="6-digit pincode starting with 1-9"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="fetch-zip"
                  onClick={() => {
                    setTouched((t) => ({ ...t, zip: true }));
                    validateField("zip");
                    const v = (form.zip || "").trim();
                    if (/^[1-9][0-9]{5}$/.test(v)) handlePincodeLookup(v);
                  }}
                >
                  Fetch
                </button>
              </div>
              {errors.zip && (touched.zip || submitted) && <div className="error">{errors.zip}</div>}
            </div>

            {/* CITY */}
            <div className="col-md-4">
              <label className="required">City</label>
              <input
                className="form-control"
                name="city"
                value={form.city}
                onChange={handleChange}
                onBlur={handleBlur}
                list="city-list"
                placeholder="City"
              />
              <datalist id="city-list">
                {cities.map((c) => (
                  <option key={c.name} value={c.name} />
                ))}
              </datalist>
            </div>

            {/* STATE */}
            <div className="col-md-4">
              <label className="required">State</label>
              <input className="form-control" name="state" value={form.state} onChange={handleChange} onBlur={handleBlur} />
            </div>
          </div>

          {/* BUTTON */}
          <div className="d-flex justify-content-center mt-4" >
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
