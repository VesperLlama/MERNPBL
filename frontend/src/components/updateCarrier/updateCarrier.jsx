import React, { useState } from "react";
import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
import "./updateCarrier.css";

export default function UpdateCarrier() {
  const [carrierId, setCarrierId] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [carrier, setCarrier] = useState({
    carrierName: "",
    "30DaysAdvanceBooking": "",
    "60DaysAdvanceBooking": "",
    "90DaysAdvanceBooking": "",
    BulkBooking: "",
    SilverUser: "",
    GoldUser: "",
    PlatinumUser: "",
    "2DaysBeforeTravelDate": "",
    "10DaysBeforeTravelDate": "",
    "20DaysOrMoreBeforeTravelDate": "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  function handleBlur(k) {
    setTouched((s) => ({ ...s, [k]: true }));
  }

  function clearAll() {
    setCarrierId("");
    setCarrier({ carrierName: "", "30DaysAdvanceBooking": "", "60DaysAdvanceBooking": "", "90DaysAdvanceBooking": "", BulkBooking: "", SilverUser: "", GoldUser: "", PlatinumUser: "", "2DaysBeforeTravelDate": "", "10DaysBeforeTravelDate": "", "20DaysOrMoreBeforeTravelDate": "" });
    setErrors({});
    setTouched({});
    setSubmitted(false);
    setStatus("");
  }

  function setField(k, v) {
    setCarrier((s) => ({ ...s, [k]: v }));
  }

  function validateAll() {
    const e = {};

    // CarrierName: regex and length <= 50
    const namePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
    if (!carrier.carrierName) e.carrierName = "Required";
    else if (carrier.carrierName.length > 50) e.carrierName = "Max 50 characters";
    else if (!namePattern.test(carrier.carrierName)) e.carrierName = "Only letters and single spaces allowed";

    const parseNum = (k) => {
      const v = carrier[k];
      const n = Number(v);
      return Number.isFinite(n) ? n : NaN;
    };

    const checkRangeStep = (key, min, max, step, stepName) => {
      const v = carrier[key];
      if (v === "" || v === null || v === undefined) {
        e[key] = "Required";
        return;
      }
      const n = Number(v);
      if (!Number.isFinite(n) || n < min || n > max) {
        e[key] = `Must be between ${min} and ${max}`;
        return;
      }
      // step check relative to min (allow floating rounding tolerance)
      const offset = +(Math.round(((n - min) / step) * 1000000) / 1000000);
      const closest = +(min + offset * step).toFixed(6);
      if (Math.abs(closest - n) > 1e-6) {
        e[key] = `Must be a multiple of ${step}${stepName ? ' ('+stepName+')' : ''}`;
      }
    };

    // Discounts: enforce ranges and steps
    checkRangeStep("30DaysAdvanceBooking", 2.5, 5.0, 0.1);
    checkRangeStep("60DaysAdvanceBooking", 5.1, 7.5, 0.1);
    checkRangeStep("90DaysAdvanceBooking", 7.6, 12.0, 0.1);
    checkRangeStep("BulkBooking", 3.0, 5.0, 0.1);
    checkRangeStep("SilverUser", 2.5, 5.0, 0.1);
    checkRangeStep("GoldUser", 5.1, 7.5, 0.1);
    checkRangeStep("PlatinumUser", 7.6, 12.0, 0.1);

    // Refunds
    checkRangeStep("2DaysBeforeTravelDate", 0.0, 10.0, 0.1);
    checkRangeStep("10DaysBeforeTravelDate", 20.0, 35.0, 0.1);
    // last one step 1
    checkRangeStep("20DaysOrMoreBeforeTravelDate", 50, 70, 1);

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLoad(e) {
    e && e.preventDefault();
    setStatus("");
    if (!carrierId) {
      setStatus("Please enter Carrier ID to load.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/carriers/${encodeURIComponent(carrierId)}`, { 
        method: "GET",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }}
      );
      const data = await res.json();
      console.log(data);
      if (res.ok) {
        // carrier may be at data.data.carrier or data.data or data.carrier or data
        const c = data.data && (data.data.carrier || data.data) ? (data.data.carrier || data.data) : (data.carrier || data);

        // discounts/refunds may be nested
        const discounts = c.discounts || c.Discounts || c || {};
        const refunds = c.refunds || c.Refunds || c || {};

        const getVal = (obj, keys) => {
          for (const k of keys) if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
          return "";
        };

        setCarrier({
          carrierName: c.carrierName || c.CarrierName || c.name || "",
          "30DaysAdvanceBooking": getVal(discounts, ["30DaysAdvanceBooking", "30daysAdvanceBooking", "30Days", "30days"]),
          "60DaysAdvanceBooking": getVal(discounts, ["60DaysAdvanceBooking", "60daysAdvanceBooking", "60Days", "60days"]),
          "90DaysAdvanceBooking": getVal(discounts, ["90DaysAdvanceBooking", "90daysAdvanceBooking", "90Days", "90days"]),
          BulkBooking: getVal(discounts, ["BulkBooking", "bulkBooking", "bulk"]),
          SilverUser: getVal(discounts, ["SilverUser", "silverUser", "silver"]),
          GoldUser: getVal(discounts, ["GoldUser", "goldUser", "gold"]),
          PlatinumUser: getVal(discounts, ["PlatinumUser", "platinumUser", "platinum"]),
          "2DaysBeforeTravelDate": getVal(refunds, ["2DaysBeforeTravelDate", "2daysBeforeTravelDate"]),
          "10DaysBeforeTravelDate": getVal(refunds, ["10DaysBeforeTravelDate", "10daysBeforeTravelDate"]),
          "20DaysOrMoreBeforeTravelDate": getVal(refunds, ["20DaysOrMoreBeforeTravelDate", "20daysOrMoreBeforeTravelDate"]),
        });
        setStatus("Loaded carrier details. Edit and click Update.");
        setTouched({});
        setSubmitted(false);
      } else if (res.status === 404) {
        setStatus("Carrier not found.");
      } else {
        const text = await res.text();
        setStatus(`Load failed: ${res.status} ${text}`);
      }
    } catch (err) {
      setStatus("Failed to load carrier.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(ev) {
    ev && ev.preventDefault();
    setStatus("");
    if (!carrierId) {
      setStatus("Please enter Carrier ID to update.");
      return;
    }
    setSubmitted(true);
    if (!validateAll()) return;
    setLoading(true);
    try {
      const payload = {
        carrierName: carrier.carrierName,
        discounts: {
          "30DaysAdvanceBooking": Number(carrier["30DaysAdvanceBooking"]),
          "60DaysAdvanceBooking": Number(carrier["60DaysAdvanceBooking"]),
          "90DaysAdvanceBooking": Number(carrier["90DaysAdvanceBooking"]),
          BulkBooking: Number(carrier.BulkBooking),
          SilverUser: Number(carrier.SilverUser),
          GoldUser: Number(carrier.GoldUser),
          PlatinumUser: Number(carrier.PlatinumUser),
        },
        refunds: {
          "2DaysBeforeTravelDate": Number(carrier["2DaysBeforeTravelDate"]),
          "10DaysBeforeTravelDate": Number(carrier["10DaysBeforeTravelDate"]),
          "20DaysOrMoreBeforeTravelDate": Number(carrier["20DaysOrMoreBeforeTravelDate"]),
        },
      };

      const token = localStorage.getItem('token');
      let res = await fetch(`http://localhost:4000/api/carriers/${encodeURIComponent(carrierId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Fallback endpoint
        res = await fetch(`http://localhost:4000/api/carriers/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ carrierId, ...payload }),
        });
      }

      if (res.ok) {
        const data = await res.json();
        const msg = data && (data.message || data.status || JSON.stringify(data));
        setStatus(`Update successful: ${msg}`);
      } else {
        const text = await res.text();
        setStatus(`Update failed: ${res.status} ${text}`);
      }
    } catch (err) {
      setStatus("Failed to send update request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="uc-root">
      <AdminNavBar />
      <div className="uc-card">
        <h2>Update Carrier</h2>
        <form className="uc-form" onSubmit={handleUpdate}>
          <label className="uc-row">
            <span>Carrier ID <span className="uc-required">*</span></span>
            <input required value={carrierId} onChange={(e) => setCarrierId(e.target.value)} placeholder="Enter carrier id" />
            <button type="button" className="uc-load" onClick={handleLoad} disabled={loading}>Load</button>
          </label>

          <label className="uc-row">
            <span>Carrier Name <span className="uc-required">*</span></span>
            <select
              required
              value={carrier.carrierName}
              onChange={(e) => setField("carrierName", e.target.value)}
              onBlur={() => handleBlur("carrierName")}
            >
              <option value="">-- Select Carrier --</option>
              <option>IndiGo</option>
              <option>Air India</option>
              <option>SpiceJet</option>
              <option>Vistara</option>
              <option>Air India Express</option>
              <option>Akasa Air</option>
              <option>Alliance Air</option>
            </select>
            <div className="uc-err">{(touched.carrierName || submitted) && errors.carrierName}</div>
          </label>

          <fieldset className="uc-group">
            <legend>Early Discounts (percent)</legend>
            <label className="uc-row"><span>30 Days <span className="uc-required">*</span></span><input required placeholder="2.5 - 5.0 (step 0.1)" type="number" step="0.1" min="2.5" max="5" value={carrier["30DaysAdvanceBooking"]} onChange={(e) => setField("30DaysAdvanceBooking", e.target.value)} onBlur={() => handleBlur("30DaysAdvanceBooking")} /><div className="uc-err">{(touched["30DaysAdvanceBooking"] || submitted) && errors["30DaysAdvanceBooking"]}</div></label>
            <label className="uc-row"><span>60 Days <span className="uc-required">*</span></span><input required placeholder="5.1 - 7.5 (step 0.1)" type="number" step="0.1" min="5.1" max="7.5" value={carrier["60DaysAdvanceBooking"]} onChange={(e) => setField("60DaysAdvanceBooking", e.target.value)} onBlur={() => handleBlur("60DaysAdvanceBooking")} /><div className="uc-err">{(touched["60DaysAdvanceBooking"] || submitted) && errors["60DaysAdvanceBooking"]}</div></label>
            <label className="uc-row"><span>90 Days <span className="uc-required">*</span></span><input required placeholder="7.6 - 12.0 (step 0.1)" type="number" step="0.1" min="7.6" max="12.0" value={carrier["90DaysAdvanceBooking"]} onChange={(e) => setField("90DaysAdvanceBooking", e.target.value)} onBlur={() => handleBlur("90DaysAdvanceBooking")} /><div className="uc-err">{(touched["90DaysAdvanceBooking"] || submitted) && errors["90DaysAdvanceBooking"]}</div></label>
            <label className="uc-row"><span>Bulk Booking <span className="uc-required">*</span></span><input required placeholder="3.0 - 5.0 (step 0.1)" type="number" step="0.1" min="3.0" max="5.0" value={carrier.BulkBooking} onChange={(e) => setField("BulkBooking", e.target.value)} onBlur={() => handleBlur("BulkBooking")} /><div className="uc-err">{(touched.BulkBooking || submitted) && errors.BulkBooking}</div></label>
            <label className="uc-row"><span>Silver User <span className="uc-required">*</span></span><input required placeholder="2.5 - 5.0 (step 0.1)" type="number" step="0.1" min="2.5" max="5.0" value={carrier.SilverUser} onChange={(e) => setField("SilverUser", e.target.value)} onBlur={() => handleBlur("SilverUser")} /><div className="uc-err">{(touched.SilverUser || submitted) && errors.SilverUser}</div></label>
            <label className="uc-row"><span>Gold User <span className="uc-required">*</span></span><input required placeholder="5.1 - 7.5 (step 0.1)" type="number" step="0.1" min="5.1" max="7.5" value={carrier.GoldUser} onChange={(e) => setField("GoldUser", e.target.value)} onBlur={() => handleBlur("GoldUser")} /><div className="uc-err">{(touched.GoldUser || submitted) && errors.GoldUser}</div></label>
            <label className="uc-row"><span>Platinum User <span className="uc-required">*</span></span><input required placeholder="7.6 - 12.0 (step 0.1)" type="number" step="0.1" min="7.6" max="12.0" value={carrier.PlatinumUser} onChange={(e) => setField("PlatinumUser", e.target.value)} onBlur={() => handleBlur("PlatinumUser")} /><div className="uc-err">{(touched.PlatinumUser || submitted) && errors.PlatinumUser}</div></label>
          </fieldset>

          <fieldset className="uc-group">
            <legend>Cancellation Refunds (percent)</legend>
            <label className="uc-row"><span>2 Days Before <span className="uc-required">*</span></span><input required placeholder="0.0 - 10.0 (step 0.1)" type="number" step="0.1" min="0" max="10" value={carrier["2DaysBeforeTravelDate"]} onChange={(e) => setField("2DaysBeforeTravelDate", e.target.value)} onBlur={() => handleBlur("2DaysBeforeTravelDate")} /><div className="uc-err">{(touched["2DaysBeforeTravelDate"] || submitted) && errors["2DaysBeforeTravelDate"]}</div></label>
            <label className="uc-row"><span>10 Days Before <span className="uc-required">*</span></span><input required placeholder="20.0 - 35.0 (step 0.1)" type="number" step="0.1" min="20" max="35" value={carrier["10DaysBeforeTravelDate"]} onChange={(e) => setField("10DaysBeforeTravelDate", e.target.value)} onBlur={() => handleBlur("10DaysBeforeTravelDate")} /><div className="uc-err">{(touched["10DaysBeforeTravelDate"] || submitted) && errors["10DaysBeforeTravelDate"]}</div></label>
            <label className="uc-row"><span>20+ Days Before <span className="uc-required">*</span></span><input required placeholder="50 - 70 (step 1)" type="number" step="1" min="50" max="70" value={carrier["20DaysOrMoreBeforeTravelDate"]} onChange={(e) => setField("20DaysOrMoreBeforeTravelDate", e.target.value)} onBlur={() => handleBlur("20DaysOrMoreBeforeTravelDate")} /><div className="uc-err">{(touched["20DaysOrMoreBeforeTravelDate"] || submitted) && errors["20DaysOrMoreBeforeTravelDate"]}</div></label>
          </fieldset>

          <div className="uc-actions">
            <button type="submit" className="uc-update" disabled={loading}>{loading ? "Updating..." : "Update"}</button>
            <button type="button" className="uc-clear" onClick={clearAll}>Clear</button>
          </div>

          {status && <div className="uc-status">{status}</div>}
        </form>
      </div>
    </div>
  );
}
