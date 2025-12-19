import React, { useState } from "react";
import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
import "./updateCarrier.css";
import Popup from "../pop-up/pop-up.jsx";

export default function UpdateCarrier() {
  const [carrierId, setCarrierId] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [carrier, setCarrier] = useState({
      CarrierName: "",
      Discounts: {
        "30DaysAdvanceBooking": 0,
        "60DaysAdvanceBooking": 0,
        "90DaysAdvanceBooking": 0,
        BulkBooking: 0,
      },
      userDiscounts: {
        Silver: 0,
        Gold: 0,
        Platinum: 0,
      },
      Refunds: {
        "2DaysBeforeTravelDate": 0,
        "10DaysBeforeTravelDate": 0,
        "20DaysOrMoreBeforeTravelDate": 0,
      },
    });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState("");

  function handleBlur(k) {
    setTouched((s) => ({ ...s, [k]: true }));
  }

  function clearAll() {
    setCarrierId("");
    setCarrier({
      CarrierName: "",
      Discounts: {
        "30DaysAdvanceBooking": 0,
        "60DaysAdvanceBooking": 0,
        "90DaysAdvanceBooking": 0,
        BulkBooking: 0,
      },
      userDiscounts: {
        Silver: 0,
        Gold: 0,
        Platinum: 0,
      },
      Refunds: {
        "2DaysBeforeTravelDate": 0,
        "10DaysBeforeTravelDate": 0,
        "20DaysOrMoreBeforeTravelDate": 0,
      },
    });
    setErrors({});
    setTouched({});
    setSubmitted(false);
    setStatus("");
    setToastType("");
    setToastOpen(false);
  }

  // function setField(k, v) {
  //   setCarrier((s) => ({ ...s, [k]: v }));
  // }

  function setField(path, value) {
    setCarrier((prev) => {
      const keys = path.split(".");
      const lastKey = keys.pop();

      const next = { ...prev };
      let cursor = next;

      for (const key of keys) {
        cursor[key] = { ...(cursor[key] ?? {}) };
        cursor = cursor[key];
      }

      cursor[lastKey] = value;
      return next;
    });
  }

  function validateAll() {
    const e = {};

    // CarrierName: regex and length <= 50
    const namePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
    if (!carrier.CarrierName) e.carrierName = "Required";
    else if (carrier.CarrierName.length > 50)
      e.carrierName = "Max 50 characters";
    else if (!namePattern.test(carrier.CarrierName))
      e.carrierName = "Only letters and single spaces allowed";

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
        e[key] = `Must be a multiple of ${step}${
          stepName ? " (" + stepName + ")" : ""
        }`;
      }
    };

    // Discounts: enforce ranges and steps
    // checkRangeStep("30DaysAdvanceBooking", 2.5, 5.0, 0.1);
    // checkRangeStep("60DaysAdvanceBooking", 5.1, 7.5, 0.1);
    // checkRangeStep("90DaysAdvanceBooking", 7.6, 12.0, 0.1);
    // checkRangeStep("BulkBooking", 3.0, 5.0, 0.1);
    // checkRangeStep("SilverUser", 2.5, 5.0, 0.1);
    // checkRangeStep("GoldUser", 5.1, 7.5, 0.1);
    // checkRangeStep("PlatinumUser", 7.6, 12.0, 0.1);

    // // Refunds
    // checkRangeStep("2DaysBeforeTravelDate", 0.0, 10.0, 0.1);
    // checkRangeStep("10DaysBeforeTravelDate", 20.0, 35.0, 0.1);
    // // last one step 1
    // checkRangeStep("20DaysOrMoreBeforeTravelDate", 50, 70, 1);

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLoad(e) {
    e && e.preventDefault();
    setStatus("");
    if (!carrierId) {
      setStatus("Please enter Carrier ID to load.");
      setToastType("error");
      setToastOpen(true);
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
        const c = data.data && data.data.carrier ? data.data.carrier : data.data;
        // Map possible backend keys to our fields (accept various casing)
        const map = (k) => c[k] ?? c[k.toLowerCase()] ?? c[k.replace(/\d+/g, (d) => d)];
        setCarrier(c);
        setStatus("Loaded carrier details. Edit and click Update.");
        setToastType("success");
        setToastOpen(true);
        setTouched({});
        setSubmitted(false);
      } else if (res.status === 404) {
        setStatus("Carrier not found.");
        setToastType("error");
        setToastOpen(true);
      } else {
        const text = await res.text();
        setStatus(`Load failed: ${res.status} ${text}`);
        setToastType("error");
        setToastOpen(true);
      }
    } catch (err) {
      setStatus("Failed to load carrier.");
      console.log(err);
      setToastType("error");
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(ev) {
    ev && ev.preventDefault();
    setStatus("");
    if (!carrierId) {
      setStatus("Please enter Carrier ID to update.");
      setToastType("error");
      setToastOpen(true);
      return;
    }
    setSubmitted(true);
    if (!validateAll()) return;
    setLoading(true);
    try {
      const payload = {
        CarrierName: carrier.CarrierName,
        Discounts: {
          "30DaysAdvanceBooking": Number(carrier.Discounts["30DaysAdvanceBooking"]),
          "60DaysAdvanceBooking": Number(carrier.Discounts["60DaysAdvanceBooking"]),
          "90DaysAdvanceBooking": Number(carrier.Discounts["90DaysAdvanceBooking"]),
          BulkBooking: Number(carrier.Discounts.BulkBooking),
        },
        userDiscounts: {
          Silver: Number(carrier.userDiscounts.Silver),
          Gold: Number(carrier.userDiscounts.Gold),
          Platinum: Number(carrier.userDiscounts.Platinum),
        },
        refunds: {
          "2DaysBeforeTravelDate": Number(carrier.Refunds["2DaysBeforeTravelDate"]),
          "10DaysBeforeTravelDate": Number(carrier.Refunds["10DaysBeforeTravelDate"]),
          "20DaysOrMoreBeforeTravelDate": Number(carrier.Refunds["20DaysOrMoreBeforeTravelDate"]),
        },
      };

      let res = await fetch(
        `http://localhost:4000/api/carriers/update/${encodeURIComponent(
          carrierId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      // if (!res.ok) {
      //   // Fallback endpoint
      //   res = await fetch(`/api/carriers/update`, {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ carrierId, ...payload }),
      //   });
      // }

      if (res.ok) {
        const data = await res.json();
        const msg = data && (data.message || data.status || JSON.stringify(data));
        setStatus(`Update successful: ${msg}`);
        setToastType("success");
        setToastOpen(true);
      } else {
        const text = await res.text();
        setStatus(`Update failed: ${res.status} ${text}`);
        setToastType("error");
        setToastOpen(true);
      }
    } catch (err) {
      setStatus("Failed to send update request.");
      setToastType("error");
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="uc-root" style={{background: "#397367"}}>
      <AdminNavBar />
      <Popup open={toastOpen} message={status} type={toastType} onClose={() => { setToastOpen(false); setStatus(''); }} />
      <div className="uc-card">
        <h2>Update Carrier</h2>
        <form className="uc-form" onSubmit={handleUpdate}>
          <label className="uc-row">
            <span>
              Carrier ID <span className="uc-required">*</span>
            </span>
            <input
              required
              value={carrierId}
              onChange={(e) => setCarrierId(e.target.value)}
              placeholder="Enter carrier id"
            />
            <button
              type="button"
              className="uc-load"
              onClick={handleLoad}
              disabled={loading}
            >
              Load
            </button>
          </label>

          <label className="uc-row">
            <span>
              Carrier Name <span className="uc-required">*</span>
            </span>
            {/* <select
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
            </select> */}
            <input
              placeholder="Enter Carrier Name"
              required
              // disabled
              value={carrier.CarrierName}
              onChange={(e) => setField("CarrierName", e.target.value)}
              onBlur={() => handleBlur("carrierName")}
            ></input>
            <div className="uc-err">
              {(touched.carrierName || submitted) && errors.carrierName}
            </div>
          </label>

          <fieldset className="uc-group">
            <legend>Early Discounts (percent)</legend>
            <label className="uc-row">
              <span>
                30 Days <span className="uc-required">*</span>
              </span>
              <input
                required
                placeholder="2.5 - 5.0 (step 0.1)"
                type="number"
                step="0.1"
                min="2.5"
                max="5"
                value={carrier.Discounts["30DaysAdvanceBooking"]}
                onChange={(e) =>
                  setField('Discounts.30DaysAdvanceBooking', e.target.value)
                }
                onBlur={() => handleBlur("30DaysAdvanceBooking")}
              />
              <div className="uc-err">
                {(touched["30DaysAdvanceBooking"] || submitted) &&
                  errors["30DaysAdvanceBooking"]}
              </div>
            </label>
            <label className="uc-row">
              <span>
                60 Days <span className="uc-required">*</span>
              </span>
              <input
                required
                placeholder="5.1 - 7.5 (step 0.1)"
                type="number"
                step="0.1"
                min="5.1"
                max="7.5"
                value={carrier.Discounts["60DaysAdvanceBooking"]}
                onChange={(e) =>
                  setField("Discounts.60DaysAdvanceBooking", e.target.value)
                }
                onBlur={() => handleBlur("60DaysAdvanceBooking")}
              />
              <div className="uc-err">
                {(touched["60DaysAdvanceBooking"] || submitted) &&
                  errors["60DaysAdvanceBooking"]}
              </div>
            </label>
            <label className="uc-row">
              <span>
                90 Days <span className="uc-required">*</span>
              </span>
              <input
                required
                placeholder="7.6 - 12.0 (step 0.1)"
                type="number"
                step="0.1"
                min="7.6"
                max="12.0"
                value={carrier.Discounts["90DaysAdvanceBooking"]}
                onChange={(e) =>
                  setField("Discounts.90DaysAdvanceBooking", e.target.value)
                }
                onBlur={() => handleBlur("90DaysAdvanceBooking")}
              />
              <div className="uc-err">
                {(touched["90DaysAdvanceBooking"] || submitted) &&
                  errors["90DaysAdvanceBooking"]}
              </div>
            </label>
            <label className="uc-row">
              <span>
                Bulk Booking <span className="uc-required">*</span>
              </span>
              <input
                required
                placeholder="3.0 - 5.0 (step 0.1)"
                type="number"
                step="0.1"
                min="3.0"
                max="5.0"
                value={carrier.Discounts.BulkBooking}
                onChange={(e) => setField("Discounts.BulkBooking", e.target.value)}
                onBlur={() => handleBlur("BulkBooking")}
              />
              <div className="uc-err">
                {(touched.BulkBooking || submitted) && errors.BulkBooking}
              </div>
            </label>
            <label className="uc-row">
              <span>
                Silver User <span className="uc-required">*</span>
              </span>
              <input
                required
                placeholder="2.5 - 5.0 (step 0.1)"
                type="number"
                step="0.1"
                min="2.5"
                max="5.0"
                value={carrier.userDiscounts.Silver}
                onChange={(e) => setField("userDiscounts.Silver", e.target.value)}
                onBlur={() => handleBlur("SilverUser")}
              />
              <div className="uc-err">
                {(touched.SilverUser || submitted) && errors.SilverUser}
              </div>
            </label>
            <label className="uc-row">
              <span>
                Gold User <span className="uc-required">*</span>
              </span>
              <input
                required
                placeholder="5.1 - 7.5 (step 0.1)"
                type="number"
                step="0.1"
                min="5.1"
                max="7.5"
                value={carrier.userDiscounts.Gold}
                onChange={(e) => setField("userDiscounts.Gold", e.target.value)}
                onBlur={() => handleBlur("GoldUser")}
              />
              <div className="uc-err">
                {(touched.GoldUser || submitted) && errors.GoldUser}
              </div>
            </label>
            <label className="uc-row">
              <span>
                Platinum User <span className="uc-required">*</span>
              </span>
              <input
                required
                placeholder="7.6 - 12.0 (step 0.1)"
                type="number"
                step="0.1"
                min="7.6"
                max="12.0"
                value={carrier.userDiscounts.Platinum}
                onChange={(e) => setField("userDiscounts.Platinum", e.target.value)}
                onBlur={() => handleBlur("PlatinumUser")}
              />
              <div className="uc-err">
                {(touched.PlatinumUser || submitted) && errors.PlatinumUser}
              </div>
            </label>
          </fieldset>

          <fieldset className="uc-group">
            <legend>Cancellation Refunds (percent)</legend>
            <label className="uc-row">
              <span>
                2 Days Before <span className="uc-required">*</span>
              </span>
              <input
                required
                placeholder="0.0 - 10.0 (step 0.1)"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={carrier.Refunds["2DaysBeforeTravelDate"]}
                onChange={(e) =>
                  setField("Refunds.2DaysBeforeTravelDate", e.target.value)
                }
                onBlur={() => handleBlur("2DaysBeforeTravelDate")}
              />
              <div className="uc-err">
                {(touched["2DaysBeforeTravelDate"] || submitted) &&
                  errors["2DaysBeforeTravelDate"]}
              </div>
            </label>
            <label className="uc-row">
              <span>
                10 Days Before <span className="uc-required">*</span>
              </span>
              <input
                required
                placeholder="20.0 - 35.0 (step 0.1)"
                type="number"
                step="0.1"
                min="20"
                max="35"
                value={carrier.Refunds["10DaysBeforeTravelDate"]}
                onChange={(e) =>
                  setField("Refunds.10DaysBeforeTravelDate", e.target.value)
                }
                onBlur={() => handleBlur("10DaysBeforeTravelDate")}
              />
              <div className="uc-err">
                {(touched["10DaysBeforeTravelDate"] || submitted) &&
                  errors["10DaysBeforeTravelDate"]}
              </div>
            </label>
            <label className="uc-row">
              <span>
                20+ Days Before <span className="uc-required">*</span>
              </span>
              <input
                required
                placeholder="50 - 70 (step 1)"
                type="number"
                step="1"
                min="50"
                max="70"
                value={carrier.Refunds["20DaysOrMoreBeforeTravelDate"]}
                onChange={(e) =>
                  setField("Refunds.20DaysOrMoreBeforeTravelDate", e.target.value)
                }
                onBlur={() => handleBlur("20DaysOrMoreBeforeTravelDate")}
              />
              <div className="uc-err">
                {(touched["20DaysOrMoreBeforeTravelDate"] || submitted) &&
                  errors["20DaysOrMoreBeforeTravelDate"]}
              </div>
            </label>
          </fieldset>

          <div className="uc-actions">
            <button style={{background: "#397367"}} type="submit" className="uc-update" disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </button>
            <button type="button" className="uc-clear" onClick={clearAll}>
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
