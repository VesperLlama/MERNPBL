import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
import "./registerCarrier.css";
import Popup from "../pop-up/pop-up.jsx";

const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

export default function RegisterCarrier() {
  const [form, setForm] = useState({
    carrierName: "",
    advance30: "",
    advance60: "",
    advance90: "",
    bulkBooking: "",
    silverUser: "",
    goldUser: "",
    platinumUser: "",
    refund2Days: "",
    refund10Days: "",
    refund20Plus: ""
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  function setErr(key, msg) {
    setErrors((e) => {
      const ne = { ...e };
      if (msg) ne[key] = msg;
      else delete ne[key];
      return ne;
    });
  }

  function validateField(name) {
    const v = (form[name] || "").toString().trim();

    switch (name) {
      case "carrierName":
        if (!v) setErr(name, "Carrier name is required");
        else if (!nameRegex.test(v) || v.length > 50) setErr(name, "Enter valid name (letters and single spaces, max 50 chars)");
        else setErr(name, null);
        break;

      // Discounts (step 0.1 ranges)
      case "advance30":
        validateNumberField(name, v, 2.5, 5.0, 0.1);
        break;
      case "advance60":
        validateNumberField(name, v, 5.1, 7.5, 0.1);
        break;
      case "advance90":
        validateNumberField(name, v, 7.6, 12.0, 0.1);
        break;
      case "bulkBooking":
        validateNumberField(name, v, 3.0, 5.0, 0.1);
        break;
      case "silverUser":
        validateNumberField(name, v, 2.5, 5.0, 0.1);
        break;
      case "goldUser":
        validateNumberField(name, v, 5.1, 7.5, 0.1);
        break;
      case "platinumUser":
        validateNumberField(name, v, 7.6, 12.0, 0.1);
        break;

      // Refunds
      case "refund2Days":
        validateNumberField(name, v, 0.0, 10.0, 0.1);
        break;
      case "refund10Days":
        validateNumberField(name, v, 20.0, 35.0, 0.1);
        break;
      case "refund20Plus":
        validateNumberField(name, v, 50.0, 70.0, 1.0);
        break;

      default:
        break;
    }
  }

  function validateNumberField(name, v, min, max, step) {
    if (v === "") {
      setErr(name, "This field is required");
      return;
    }
    const num = Number(v);
    if (Number.isNaN(num) || num < min || num > max) {
      setErr(name, `Enter a number between ${min} and ${max}`);
      return;
    }
    // check step (allow small float imprecision)
    const multiplier = step >= 1 ? 1 : Math.round(1 / step);
    if (Math.abs(Math.round(num * multiplier) - num * multiplier) > 1e-6) {
      setErr(name, `Value must step by ${step}`);
      return;
    }
    setErr(name, null);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (touched[name]) validateField(name);
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    validateField(name);
  }

  function validateAll() {
    const keys = Object.keys(form);
    keys.forEach((k) => validateField(k));
    const hasErrors = Object.keys(errors).length > 0;
    return !hasErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    // run validation synchronously for all fields
    Object.keys(form).forEach((k) => validateField(k));

    // small timeout to let state updates happen (or simply check errors after validating)
    await new Promise((r) => setTimeout(r, 10));
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        carrierName: form.carrierName,
        discounts: {
          "30DaysAdvanceBooking": Number(form.advance30),
          "60DaysAdvanceBooking": Number(form.advance60),
          "90DaysAdvanceBooking": Number(form.advance90),
          "BulkBooking": Number(form.bulkBooking)
        },
        userDiscounts: {
          Silver: Number(form.silverUser),
          Gold: Number(form.goldUser),
          Platinum: Number(form.platinumUser)
        },
        refunds: {
          "2DaysBeforeTravelDate": Number(form.refund2Days),
          "10DaysBeforeTravelDate": Number(form.refund10Days),
          "20DaysOrMoreBeforeTravelDate": Number(form.refund20Plus)
        }
      };

      const res = await fetch("http://localhost:4000/api/carriers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const id = data.carrierId || data.id || data.carrierID;
      if (id) {
        const msg = `Carrier registered successfully. Carrier ID: ${id}`;
        setToastMsg(msg);
        setToastType('success');
        setToastOpen(true);
      } else {
        const msg = "Carrier registered successfully.";
        setToastMsg(msg);
        setToastType('success');
        setToastOpen(true);
      }
      // optional: clear form
      setForm({
        carrierName: "",
        advance30: "",
        advance60: "",
        advance90: "",
        bulkBooking: "",
        silverUser: "",
        goldUser: "",
        platinumUser: "",
        refund2Days: "",
        refund10Days: "",
        refund20Plus: ""
      });
      setTouched({});
      setErrors({});
      setSubmitted(false);
    } catch (err) {
      const msg = "Failed to register carrier: " + err.message;
      setToastMsg(msg);
      setToastType('error');
      setToastOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  const navigate = useNavigate();

  return (
    <div style={{ background:"#5da399", minHeight: "100vh", display: "flex", flexDirection: "column"}}>
      <AdminNavBar />
      <Popup open={toastOpen} message={toastMsg} type={toastType} onClose={() => { setToastOpen(false); setToastMsg(''); }} />
      <div style={{ width: "100%", maxWidth: 980, margin: "28px auto", background: "#fff", padding: 22, borderRadius: 12, boxShadow: "0 10px 30px rgba(9,30,66,0.06)" }}>
        <h2>Register Carrier</h2>
        <p className="required-note">Fields marked <span className="req">*</span> are required</p>

        <form onSubmit={handleSubmit}>
          <div className="grid">
            <div className="col">
              <label className="required">Carrier Name</label>
              <input required name="carrierName" value={form.carrierName} onChange={handleChange} onBlur={handleBlur}></input>
              {errors.carrierName && (touched.carrierName || submitted) && <div className="error">{errors.carrierName}</div>}
            </div>

            <div className="col">
              <label className="required">30 Days Advance Booking (%)</label>
              <input required name="advance30" value={form.advance30} onChange={handleChange} onBlur={handleBlur} placeholder="2.5 - 5.0" type="number" step="0.1" min="2.5" max="5.0" />
              {errors.advance30 && (touched.advance30 || submitted) && <div className="error">{errors.advance30}</div>}
            </div>

            <div className="col">
              <label className="required">60 Days Advance Booking (%)</label>
              <input required name="advance60" value={form.advance60} onChange={handleChange} onBlur={handleBlur} placeholder="5.1 - 7.5" type="number" step="0.1" min="5.1" max="7.5" />
              {errors.advance60 && (touched.advance60 || submitted) && <div className="error">{errors.advance60}</div>}
            </div>

            <div className="col">
              <label className="required">90 Days Advance Booking (%)</label>
              <input required name="advance90" value={form.advance90} onChange={handleChange} onBlur={handleBlur} placeholder="7.6 - 12.0" type="number" step="0.1" min="7.6" max="12.0" />
              {errors.advance90 && (touched.advance90 || submitted) && <div className="error">{errors.advance90}</div>}
            </div>

            <div className="col">
              <label className="required">Bulk Booking (%)</label>
              <input required name="bulkBooking" value={form.bulkBooking} onChange={handleChange} onBlur={handleBlur} placeholder="3.0 - 5.0" type="number" step="0.1" min="3.0" max="5.0" />
              {errors.bulkBooking && (touched.bulkBooking || submitted) && <div className="error">{errors.bulkBooking}</div>}
            </div>

            <div className="col">
              <label className="required">Silver User (%)</label>
              <input required name="silverUser" value={form.silverUser} onChange={handleChange} onBlur={handleBlur} placeholder="2.5 - 5.0" type="number" step="0.1" min="2.5" max="5.0" />
              {errors.silverUser && (touched.silverUser || submitted) && <div className="error">{errors.silverUser}</div>}
            </div>

            <div className="col">
              <label className="required">Gold User (%)</label>
              <input required name="goldUser" value={form.goldUser} onChange={handleChange} onBlur={handleBlur} placeholder="5.1 - 7.5" type="number" step="0.1" min="5.1" max="7.5" />
              {errors.goldUser && (touched.goldUser || submitted) && <div className="error">{errors.goldUser}</div>}
            </div>

            <div className="col">
              <label className="required">Platinum User (%)</label>
              <input required name="platinumUser" value={form.platinumUser} onChange={handleChange} onBlur={handleBlur} placeholder="7.6 - 12.0" type="number" step="0.1" min="7.6" max="12.0" />
              {errors.platinumUser && (touched.platinumUser || submitted) && <div className="error">{errors.platinumUser}</div>}
            </div>

            <div className="col">
              <label className="required">Cancel Refund, 2 Days Before Travel (%)</label>
              <input required name="refund2Days" value={form.refund2Days} onChange={handleChange} onBlur={handleBlur} placeholder="0 - 10" type="number" step="0.1" min="0" max="10" />
              {errors.refund2Days && (touched.refund2Days || submitted) && <div className="error">{errors.refund2Days}</div>}
            </div>

            <div className="col">
              <label className="required">Cancel Refund, 10 Days Before Travel (%)</label>
              <input required name="refund10Days" value={form.refund10Days} onChange={handleChange} onBlur={handleBlur} placeholder="20 - 35" type="number" step="0.1" min="20" max="35" />
              {errors.refund10Days && (touched.refund10Days || submitted) && <div className="error">{errors.refund10Days}</div>}
            </div>

            <div className="col">
              <label className="required">Cancel Refund, &gt; 20 Days Before Travel (%)</label>
              <input required name="refund20Plus" value={form.refund20Plus} onChange={handleChange} onBlur={handleBlur} placeholder="50 - 70" type="number" step="1" min="50" max="70" />
              {errors.refund20Plus && (touched.refund20Plus || submitted) && <div className="error">{errors.refund20Plus}</div>}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
            <button style={{background: "#397367"}} className="primary" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Register Carrier"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
