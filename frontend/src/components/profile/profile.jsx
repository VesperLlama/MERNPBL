// Profile.jsx
import React, { useEffect, useRef, useState } from "react";
import "./profile.css";
import CustomerNavbar from "../customerNavbar/customerNavbar";
import Popup from "../pop-up/pop-up";

const cities = [
  { name: "Mumbai", state: "Maharashtra", zip: "400001" },
  { name: "Delhi", state: "Delhi", zip: "110001" },
  { name: "Bengaluru", state: "Karnataka", zip: "560001" },
  { name: "Chennai", state: "Tamil Nadu", zip: "600001" },
  { name: "Kolkata", state: "West Bengal", zip: "700001" },
  { name: "Lucknow", state: "Uttar Pradesh", zip: "226001" },
];

// VALIDATIONS (same as register)
const fullnameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const phoneRegex = /^[6-9]\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// strong password: 8+ chars, upper, lower, digit, special
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export default function Profile({ userId: propUserId }) {
  const [userId, setUserId] = useState(propUserId || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverMessage, setServerMessage] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    dob: "",
    estimatedSpend: 0,
    role: "Customer",
    customerCategory: ""
  });

  const lastSavedRef = useRef(form); // store last saved form for cancel/revert
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const pinAbortRef = useRef(null);

  // editing state
  const [isEditing, setIsEditing] = useState(false);

  // change-password UI state
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [toastType, setToastType] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  // compute category from estimatedSpend (same rules)
  useEffect(() => {
    const spend = Number(form.estimatedSpend) || 0;
    if (spend >= 1000000) setForm((f) => ({ ...f, customerCategory: "Platinum" }));
    else if (spend >= 500000) setForm((f) => ({ ...f, customerCategory: "Gold" }));
    else setForm((f) => ({ ...f, customerCategory: "Silver" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.estimatedSpend]);

  // try to determine userId from props or localStorage
  useEffect(() => {
    if (propUserId) {
      setUserId(propUserId);
      return;
    }
    const fromLSId = JSON.parse(localStorage.getItem("user")).id;
    if (fromLSId) {
      setUserId(fromLSId);
      return;
    }
    // optionally a serialized user object
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      try {
        const u = JSON.parse(currentUser);
        if (u && (u.id || u.customerId || u.customerID)) {
          setUserId(u.id || u.customerId || u.customerID);
        } else if (u) {
          hydrateFromObject(u);
          lastSavedRef.current = { ...form, ...u };
          setLoading(false);
        }
      } catch (e) {
        // ignore
      }
    }
    // if none found, component will still attempt to fetch if prop set later
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propUserId]);

  // fetch user data when we have an id
  useEffect(() => {
    let mounted = true;
    async function fetchUser(userId) {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:4000/api/customers/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();

        if (mounted) {
          hydrateFromObject(data);
          lastSavedRef.current = { ...lastSavedRef.current, ...data };
        }
      } catch (err) {
        // if no backend or fetch fails, try load from localStorage if available
        const currentUser = localStorage.getItem("currentUser");
        if (currentUser && mounted) {
          try {
            hydrateFromObject(JSON.parse(currentUser));
            lastSavedRef.current = { ...lastSavedRef.current, ...JSON.parse(currentUser) };
          } catch (e) {}
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (userId) fetchUser(userId);
    else setLoading(false);
    return () => {
      mounted = false;
      if (pinAbortRef.current) pinAbortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function hydrateFromObject(data) {
    // map server fields conservatively
    setForm((f) => ({
      ...f,
      fullName: data.FullName || data.name || f.FullName,
      phone: data.Phone || f.Phone,
      email: data.EmailId || f.EmailId,
      address1: data.AddressLine1 || f.AddressLine1,
      address2: data.AddressLine2 || f.AddressLine2,
      city: data.City || f.City,
      state: data.State || f.State,
      zip: data.ZipCode || f.ZipCode,
      dob: (data.DOB || data.dateOfBirth || "").slice ? (data.DOB || data.dateOfBirth || "").slice(0, 10) : f.DOB,
      estimatedSpend: data.estimatedSpend != null ? data.estimatedSpend : f.estimatedSpend,
      role: data.Role || f.Role,
      customerCategory: data.CustomerCategory || f.CustomerCategory
    }));
  }

  function validateField(name, value = form[name]) {
    const e = { ...errors };
    const setErr = (k, m) => {
      if (m) e[k] = m;
      else delete e[k];
    };

    switch (name) {
      case "fullName":
        setErr(
          "fullName",
          !fullnameRegex.test(value) ? "Enter valid name (letters only, single spaces allowed)" : null
        );
        break;
      case "phone":
        setErr("phone", !phoneRegex.test(value) ? "Phone must be 10 digits, starting with 6–9" : null);
        break;
      case "zip":
        setErr("zip", !/^[1-9][0-9]{5}$/.test(value) ? "Pincode must be 6 digits and start with 1-9" : null);
        break;
      case "address1":
        setErr("address1", !value ? "Address Line 1 is required" : null);
        break;
      default:
        break;
    }
    setErrors(e);
  }

  function validateAll() {
    const e = {};
    if (!fullnameRegex.test(form.fullName)) e.fullName = "Enter valid name (letters only, single spaces allowed)";
    if (!phoneRegex.test(form.phone)) e.phone = "Phone must be 10 digits, starting with 6–9";
    if (!/^[1-9][0-9]{5}$/.test(form.zip)) e.zip = "Pincode must be 6 digits and start with 1-9";
    if (!form.address1) e.address1 = "Address Line 1 is required";
    // dob remains read-only but ensure it exists and meets age rules
    if (!form.dob) e.dob = "Date of birth missing";
    else {
      const dobDate = new Date(form.dob);
      const min = new Date("1930-01-01");
      const now = new Date();
      const max = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
      if (dobDate < min || dobDate > max) e.dob = "Must be 18+ years old & born after 01/01/1930";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handlePincodeLookup(zip) {
    if (!/^[1-9][0-9]{5}$/.test(zip)) return;
    if (pinAbortRef.current) pinAbortRef.current.abort();
    const ac = new AbortController();
    pinAbortRef.current = ac;

    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${zip}`, { signal: ac.signal });
      const json = await res.json();
      if (!Array.isArray(json) || json.length === 0) return;
      const entry = json[0];
      if (entry.Status !== "Success" || !entry.PostOffice || entry.PostOffice.length === 0) {
        setForm((f) => ({ ...f, city: "Invalid Pincode", state: "Invalid Pincode", zip }));
        setErrors((e) => ({ ...e, zip: "Invalid Pincode" }));
        return;
      }
      const po = entry.PostOffice[0];
      setForm((f) => ({ ...f, city: po.District || po.Name || f.city, state: po.State || f.state, zip }));
      setErrors((e) => {
        const ne = { ...e };
        delete ne.zip;
        return ne;
      });
    } catch (err) {
      // ignore network errors
    } finally {
      pinAbortRef.current = null;
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
    } else if (name === "estimatedSpend") {
      // allow blank or numeric-only value
      const numeric = value === "" ? "" : Number(value);
      setForm((prev) => ({ ...prev, estimatedSpend: numeric }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    if (touched[name]) validateField(name, value);
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));

    if (name === "zip") {
      const v = (e.target.value || "").trim();
      validateField("zip", v);
      if (/^[1-9][0-9]{5}$/.test(v)) handlePincodeLookup(v);
    } else {
      validateField(name, form[name]);
    }
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setServerMessage(null);

    if (!validateAll()) {
      setServerMessage("Fix highlighted errors before saving.");
      setToastType("error");
      setToastOpen(true);
      return;
    }

    setSaving(true);
    const payload = { ...form };
    // email and dob are uneditable client-side; remove to avoid accidental overwrite
    delete payload.email;
    delete payload.dob;
    delete payload.fullName;
    delete payload.phone;
    delete payload.customerCategory;
    delete payload.role;

    try {
      const idToUse = userId || localStorage.getItem("id") || localStorage.getItem("ID");
      if (!idToUse) throw new Error("User ID not available. Cannot save.");

      const res = await fetch(`http://localhost:4000/api/customers/update-profile/${idToUse}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Save failed" }));
        throw new Error(err.message || "Save failed");
      }
      const data = await res.json();
      // update local form from returned data if any
      hydrateFromObject(data.data);
      lastSavedRef.current = { ...lastSavedRef.current, ...payload };
      setServerMessage("Profile saved successfully.");
      setToastType("success");
      setToastOpen(true);
      setIsEditing(false);
      // optionally update localStorage copy
      try {
        localStorage.setItem("currentUser", JSON.stringify({ ...form, id: idToUse }));
      } catch (e) {}
    } catch (err) {
      setServerMessage("Save failed: " + err.message);
      setToastType("error");
      setToastOpen(true);
    } finally {
      setSaving(false);
    }
  }

  // ---- Change password handlers ----
  function validatePwdForm() {
    const e = {};
    if (!pwdForm.currentPassword) e.currentPassword = "Current password is required";
    if (!pwdForm.newPassword) e.newPassword = "New password is required";
    else if (!passwordRegex.test(pwdForm.newPassword))
      e.newPassword = "Password must be 8+ chars and include upper, lower, number & special char";
    if (!pwdForm.confirmNewPassword) e.confirmNewPassword = "Confirm the new password";
    else if (pwdForm.newPassword !== pwdForm.confirmNewPassword) e.confirmNewPassword = "New & Confirm passwords do not match";
    setPwdErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleChangePassword(ev) {
    ev.preventDefault();
    setServerMessage(null);
    setToastType("");
    setToastOpen(false);

    if (!validatePwdForm()) return;

    setPwdSubmitting(true);
    try {
      const idToUse = userId || localStorage.getItem("customerId") || localStorage.getItem("customerID");
      if (!idToUse) throw new Error("User ID not available. Cannot change password.");

      const res = await fetch(`http://localhost:4000/api/customers/update-profile/${idToUse}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          currentPassword: pwdForm.currentPassword,
          newPassword: pwdForm.newPassword
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.message }));
        throw new Error(err.message || "Change password failed");
      }

      setServerMessage("Password changed successfully.");
      setToastType("success");
      setToastOpen(true);
      setPwdForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setShowChangePwd(false);
    } catch (err) {
      setServerMessage("Change password failed: " + err.message);
      setToastType("error");
      setToastOpen(true);
    } finally {
      setPwdSubmitting(false);
    }
  }

  // ---- UI helpers ----
  const greetingName = (form.fullName || "Customer").split(" ")[0];
  const initials = (form.fullName || "C").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
  const tierClass = (form.customerCategory || "Silver").toLowerCase();

  // cancel edits -> revert to lastSavedRef
  function handleCancelEdit() {
    // setForm((prev) => ({ ...lastSavedRef.current }));
    setErrors({});
    setTouched({});
    setIsEditing(false);
    setServerMessage(null);
    setToastType("");
    setToastOpen(false);
  }

  return (
<>
<CustomerNavbar />
<Popup open={toastOpen} message={serverMessage} type={toastType} onClose={() => { setToastOpen(false); setServerMessage(''); }} />
    
    <div className="pr-root">
      <div className="pr-container">
        <div className="pr-card">
          {/* LEFT: avatar + basic */}
          <div className="pr-left">
            <div className="avatar">{initials}</div>
            <div className="pr-basic">
              <div className="pr-email">Email: {form.email || "--"}</div>
              <div className="pr-id">ID: {userId || "--"}</div>
            </div>
          </div>

          {/* RIGHT: actions + form */}
          <div className="pr-right">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <h2 className="profile-heading" style={{ margin: 0 }}>
                  <span
                    className={`category-badge-hero ${tierClass}`}
                    style={{ marginLeft: 12 }}
                    title={`${(form.customerCategory || "Silver").toUpperCase()} user`}
                  >
                    {/* small icon */}
                    <svg className="category-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      {form.customerCategory === "Platinum" ? (
                        <path d="M12 2l2.9 6.0L21 9.2l-5 4.0L17.8 21 12 17.7 6.2 21 8 13.2 3 9.2l6.1-1.2L12 2z" />
                      ) : form.customerCategory === "Gold" ? (
                        <path d="M12 2a7 7 0 107 7 7.01 7.01 0 00-7-7zm0 2a5 5 0 11-5 5 5 5 0 015-5zM6 18v2h12v-2a4 4 0 00-4-4H10a4 4 0 00-4 4z" />
                      ) : (
                        <>
                          <circle cx="12" cy="10" r="4" />
                          <path d="M4 20v-1a7 7 0 0114 0v1" />
                        </>
                      )}
                    </svg>

                    <span className="category-text">
                      {(form.customerCategory || "Silver").toUpperCase()}
                    </span>
                  </span>
                </h2>
              </div>

              <div className="pr-actions">
                {!isEditing ? (
                  <button
                    className="btn edit"
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setServerMessage(null);
                    }}
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    className="btn cancel"
                    type="button"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                )}

              </div>
            </div>

            {serverMessage && (
              <div className={`pr-msg`} style={{ color: serverMessage.type === "error" ? "crimson" : "green" }}>
                {serverMessage.text}
              </div>
            )}

            {loading ? (
              <div>Loading...</div>
            ) : (
              <form onSubmit={handleSubmit} className="pr-form" noValidate>
                <div className="pr-row">
                  <div className="half">
                    <label className="pr-label">Full Name
                      <input
                        className="pr-input"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Enter full name"
                        aria-invalid={!!errors.fullName}
                        autoComplete="name"
                        disabled
                        readOnly={!isEditing}
                      />
                    </label>
                    {errors.fullName && (touched.fullName) && <div className="error">{errors.fullName}</div>}
                  </div>

                  <div className="half">
                    <label className="pr-label">Email
                      <input
                        className="pr-input"
                        name="email"
                        type="email"
                        value={form.email}
                        readOnly
                        disabled
                        aria-readonly="true"
                        autoComplete="email"
                      />
                    {/* <small style={{"color": "red"}}>Cannot change email</small> */}
                    </label>
                  </div>
                </div>

                <div className="pr-row">
                  <div className="half">
                    <label className="pr-label">Phone
                      <input
                        className="pr-input"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="10 digit number"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        aria-invalid={!!errors.phone}
                        autoComplete="tel"
                        readOnly={!isEditing}
                      />
                    </label>
                    {errors.phone && (touched.phone) && <div className="error">{errors.phone}</div>}
                  </div>

                  <div className="half">
                    <label className="pr-label">Date of Birth
                      <input
                        className="pr-input"
                        name="dob"
                        type="date"
                        disabled
                        value={form.dob}
                        readOnly
                        aria-readonly="true"
                      />
                    {/* <small style={{"color": "red"}}>Cannot change DOB</small> */}
                    </label>
                    {errors.dob && <div className="error">{errors.dob}</div>}
                  </div>
                </div>

                <div className="pr-row">
                  {/* <div className="half">
                    <label className="pr-label">Estimated Spend on Flights (INR)
                      <input
                        className="pr-input"
                        name="estimatedSpend"
                        type="number"
                        min="0"
                        step="1"
                        value={form.estimatedSpend === "" ? "" : form.estimatedSpend}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="e.g. 20000"
                        autoComplete="off"
                        disabled
                        readOnly={!isEditing}
                      />
                    </label>
                  </div> */}

                  <div className="half">
                    <label className="pr-label">Address Line 1
                      <input
                        className="pr-input"
                        name="address1"
                        value={form.address1}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="street-address"
                        aria-invalid={!!errors.address1}
                        readOnly={!isEditing}
                      />
                    </label>
                    {errors.address1 && (touched.address1) && <div className="error">{errors.address1}</div>}
                  </div>
                </div>

                <div>
                  <label className="pr-label">Address Line 2 (optional)
                    <input
                      className="pr-input"
                      name="address2"
                      value={form.address2}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="address-line2"
                      readOnly={!isEditing}
                    />
                  </label>
                </div>

                <div className="pr-row">
                  <div style={{ flex: "0 0 220px" }}>
                    <label className="pr-label">Pincode
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <input
                          className="pr-input"
                          name="zip"
                          value={form.zip}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="6-digit pincode starting with 1-9"
                          style={{ flex: 1 }}
                          inputMode="numeric"
                          aria-invalid={!!errors.zip}
                          autoComplete="postal-code"
                          readOnly={!isEditing}
                        />
                        <button
                          type="button"
                          className="btn"
                          onClick={() => {
                            setTouched((t) => ({ ...t, zip: true }));
                            validateField("zip", form.zip);
                            const v = (form.zip || "").trim();
                            if (/^[1-9][0-9]{5}$/.test(v)) handlePincodeLookup(v);
                          }}
                          disabled={!isEditing}
                        >
                          Fetch
                        </button>
                      </div>
                    </label>
                    {errors.zip && (touched.zip) && <div className="error">{errors.zip}</div>}
                  </div>

                  <div className="half">
                    <label className="pr-label">City
                      <input
                        className="pr-input"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        list="city-list"
                        placeholder="City"
                        autoComplete="address-level2"
                        readOnly={!isEditing}
                      />
                    </label>
                    <datalist id="city-list">
                      {cities.map((c) => (
                        <option key={c.name} value={c.name} />
                      ))}
                    </datalist>
                  </div>

                  <div style={{ flex: "0 0 220px" }}>
                    <label className="pr-label">State
                      <input
                        className="pr-input"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="State"
                        autoComplete="address-level1"
                        readOnly={!isEditing}
                      />
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                  {isEditing ? (
                    <button className="btn save" type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Update Profile"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setShowChangePwd((s) => !s);
                        setServerMessage(null);
                      }}
                    >
                      {showChangePwd ? "Hide Change Password" : "Change Password"}
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Change Password area */}
            {showChangePwd && (
              <div style={{ marginTop: 14 }}>
                <form onSubmit={handleChangePassword} className="pr-form" noValidate>
                  <div className="pr-row">
                    <div className="half">
                      <label className="pr-label">Current Password
                        <input
                          className="pr-input"
                          name="currentPassword"
                          type="password"
                          value={pwdForm.currentPassword}
                          onChange={(e) => setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))}
                        />
                      </label>
                      {pwdErrors.currentPassword && <div className="error">{pwdErrors.currentPassword}</div>}
                    </div>

                    <div className="half">
                      <label className="pr-label">New Password
                        <input
                          className="pr-input"
                          name="newPassword"
                          type="password"
                          value={pwdForm.newPassword}
                          onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
                        />
                      </label>
                      {pwdErrors.newPassword && <div className="error">{pwdErrors.newPassword}</div>}
                    </div>
                  </div>

                  <div>
                    <label className="pr-label">Confirm New Password
                      <input
                        className="pr-input"
                        name="confirmNewPassword"
                        type="password"
                        value={pwdForm.confirmNewPassword}
                        onChange={(e) => setPwdForm((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                      />
                    </label>
                    {pwdErrors.confirmNewPassword && <div className="error">{pwdErrors.confirmNewPassword}</div>}
                  </div>

                  <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 12 }}>
                    <button className="btn save" type="submit" disabled={pwdSubmitting}>
                      {pwdSubmitting ? "Saving..." : "Change Password"}
                    </button>
                    <button
                      type="button"
                      className="btn cancel"
                      onClick={() => {
                        setShowChangePwd(false);
                        setPwdForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
                        setPwdErrors({});
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}