// Payment.jsx
import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
} from "react";
import { useSearchParams } from "react-router-dom";
import CustomerNavbar from "../customerNavbar/customerNavbar.jsx";
import "./payment.css";

/**
 * Payment Component (improved)
 * - PassengerForm is embedded in this file (no extra files required)
 * - PassengerForm renders NAME / AGE / GENDER inputs for each passenger
 * - handlePay validates passenger form first, then payment fields
 */

const EMPTY = { type: "", message: "" };

/* ---------------- PassengerForm (embedded) ----------------
   Props:
    - adults: number
    - children: number
    - onChange: fn(passengers)
    - initialPassengers: optional
   Exposed via ref:
    - validate() -> { ok: true } | { ok:false, errors: [...] }
    - getPassengers() -> array
*/
const PassengerForm = forwardRef(
  ({ adults = 1, children = 0, onChange, initialPassengers = [] }, ref) => {
    const totalSeats = Number(adults || 0) + Number(children || 0);

    const buildInitial = useCallback(() => {
      const arr = [];
      for (let i = 0; i < totalSeats; i++) {
        const seed = initialPassengers[i] || {};
        arr.push({
          name: seed.name || "",
          age: seed.age || "",
          gender: seed.gender || "",
          type: "Passenger",
        });
      }
      return arr;
    }, [totalSeats, adults, initialPassengers]);

    const [passengers, setPassengers] = useState(buildInitial);
    const [fieldErrors, setFieldErrors] = useState({}); // keyed by `${index}.${field}`

    useEffect(() => {
      // sync when counts change; preserve previous values where possible
      setPassengers((prev) => {
        const next = buildInitial();
        for (let i = 0; i < Math.min(prev.length, next.length); i++) {
          next[i] = { ...next[i], ...prev[i] };
          next[i].type = "Passenger";
        }
        return next;
      });
    }, [adults, children, buildInitial]);

    useEffect(() => {
      if (typeof onChange === "function") onChange(passengers);
    }, [passengers, onChange]);

    const updateField = (index, field, value) => {
      setPassengers((prev) => {
        const copy = prev.map((p) => ({ ...p }));
        copy[index][field] = value;
        return copy;
      });

      // live-clear single-field error when user types
      setFieldErrors((prev) => {
        const key = `${index}.${field}`;
        if (!prev[key]) return prev;
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    };

    // validation (digit-by-digit for ages)
    const validate = () => {
      const errors = [];
      const newFieldErrors = {};
      passengers.forEach((p, i) => {
        const name = (p.name || "").toString().trim();
        const ageRaw = (p.age || "").toString().trim();
        if (!name) {
          errors.push({ index: i, field: "name", message: "Name is required" });
          newFieldErrors[`${i}.name`] = "Name is required";
        }

        if (!ageRaw) {
          errors.push({ index: i, field: "age", message: "Age is required" });
          newFieldErrors[`${i}.age`] = "Age is required";
        } else {
          if (!/^\d+$/.test(ageRaw)) {
            errors.push({
              index: i,
              field: "age",
              message: "Age must be a positive integer",
            });
            newFieldErrors[`${i}.age`] = "Age must be a positive integer";
          } else {
            const ageNum = Number(ageRaw);
            if (ageNum <= 0 || ageNum > 120) {
              errors.push({
                index: i,
                field: "age",
                message: "Enter a realistic age (1-120)",
              });
              newFieldErrors[`${i}.age`] = "Enter a realistic age (1-120)";
            }
          }
        }

        if (!p.gender) {
          errors.push({
            index: i,
            field: "gender",
            message: "Gender is required",
          });
          newFieldErrors[`${i}.gender`] = "Gender is required";
        }
      });

      setFieldErrors(newFieldErrors);
      if (errors.length === 0) return { ok: true };
      return { ok: false, errors };
    };

    useImperativeHandle(ref, () => ({
      getPassengers: () => passengers.map((p) => ({ ...p })),
      validate: () => validate(),
    }));

    return (
      <div className="passenger-form-root">
        <h3>Passenger Details ({passengers.length})</h3>
        {passengers.map((p, i) => (
          <div key={i} className="passenger-row">
            <div className="passenger-header">
              <strong>
                {i + 1}. {p.type}
              </strong>
            </div>

            <div className="passenger-fields">
              <label className="field">
                <span className="label-text">Name</span>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updateField(i, "name", e.target.value)}
                  placeholder="Full name"
                />
                {fieldErrors[`${i}.name`] && (
                  <div className="input-err">{fieldErrors[`${i}.name`]}</div>
                )}
              </label>

              <label className="field">
                <span className="label-text">Age</span>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={p.age}
                  onChange={(e) => {
                    // keep digits only
                    const filtered = e.target.value.replace(/[^\d]/g, "");
                    updateField(i, "age", filtered);
                  }}
                  placeholder="e.g. 34"
                />
                {fieldErrors[`${i}.age`] && (
                  <div className="input-err">{fieldErrors[`${i}.age`]}</div>
                )}
              </label>

              <label className="field">
                <span className="label-text">Gender</span>
                <select
                  value={p.gender}
                  onChange={(e) => updateField(i, "gender", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {fieldErrors[`${i}.gender`] && (
                  <div className="input-err">{fieldErrors[`${i}.gender`]}</div>
                )}
              </label>
            </div>

            <hr />
          </div>
        ))}
      </div>
    );
  }
);

/* ---------------- Payment Component ---------------- */
export default function Payment() {
  const [searchParams] = useSearchParams();

  // read live pricing / passengers from query params (sent from booking)
  const pricePerSeatParam = Number(searchParams.get("pricePerSeat") ?? 0);
  const totalPriceParam = Number(searchParams.get("totalPrice") ?? 0);
  const adultsParam = Number(searchParams.get("adults") ?? 0);
  const childrenParam = Number(searchParams.get("children") ?? 0);
  const seatTypeParam = searchParams.get("seatType") || searchParams.get("seat") || "";

  const passengerRef = useRef();

  const [method, setMethod] = useState("card"); // card | upi | netbank
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [globalError, setGlobalError] = useState("");

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState(""); // format MM/YY or YYYY-MM
  const [cvv, setCvv] = useState("");

  // UPI
  const [upiId, setUpiId] = useState("");

  // Netbanking
  const [bank, setBank] = useState("");
  const [nbUser, setNbUser] = useState("");
  const [nbPass, setNbPass] = useState("");

  // errors - shown live
  const [errors, setErrors] = useState({});

  // helper validations
  const onlyDigits = (s) => /^\d+$/.test(s);

  function validateCardNumberRaw(raw) {
    const n = String(raw || "").replace(/\s+/g, "");
    if (!n) return "Card number required.";
    if (n.length !== 16) return "Card number must be 16 digits.";
    if (!onlyDigits(n)) return "Card number must contain digits only.";
    if (/^(\d)\1{15}$/.test(n)) return "Enter a valid card number.";
    return "";
  }

  function validateCvvRaw(c) {
    if (!c) return "CVV required.";
    if (!/^\d{3}$/.test(String(c || ""))) return "CVV must be exactly 3 digits.";
    return "";
  }

  function expiryNotPast(mm, yy) {
    const month = Number(mm);
    const year = Number("20" + String(yy).padStart(2, "0"));

    if (!(month >= 1 && month <= 12)) return "Expiry month invalid.";

    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth() + 1;

    if (year < nowYear) return "Card has expired.";
    if (year === nowYear && month < nowMonth) return "Card has expired.";
    return "";
  }

  function validateExpiryRaw(value) {
    const v = String(value || "").trim();
    if (!v) return "Expiry required.";

    if (/^\d{4}-\d{2}$/.test(v)) {
      const [y, m] = v.split("-");
      return expiryNotPast(m, y.slice(-2));
    }

    if (/^\d{2}\/\d{2,4}$/.test(v)) {
      const parts = v.split("/");
      let mm = parts[0];
      let yy = parts[1];
      if (yy.length === 4) yy = yy.slice(-2);
      return expiryNotPast(mm, yy);
    }

    return "Expiry format invalid. Use MM/YY.";
  }

  function validateUpiRaw(id) {
    if (!id || typeof id !== "string") return "UPI ID required.";
    const trimmed = id.trim();
    if ((trimmed.match(/@/g) || []).length !== 1) return "UPI ID must contain exactly one '@'.";
    const [left, right] = trimmed.split("@");
    if (!left || left.length === 0) return "Invalid UPI ID.";
    if (!right || right.length === 0) return "Invalid UPI ID.";
    if (!/^[A-Za-z]+$/.test(right)) return "UPI domain must contain only letters after '@'.";
    if (!/^[A-Za-z0-9._\-]+$/.test(left)) return "UPI ID contains invalid characters.";
    return "";
  }

  function validateNetbankRaw(bankName, user, pass) {
    if (!bankName) return "Please select a bank.";
    if (!user || String(user).trim().length === 0) return "Enter your netbanking user id.";
    if (!pass || String(pass).trim().length === 0) return "Enter your netbanking password.";
    return "";
  }

  function validateCardNameRaw(name) {
    if (!name || !String(name).trim()) return "Cardholder name required.";
    if (!/^[A-Za-z\s\-'.]+$/.test(name)) return "Name must contain letters only (no digits or symbols).";
    return "";
  }

  function clearErrors() {
    setErrors({});
    setGlobalError("");
  }

  // live validators - called on change
  function setCardNumberLive(raw) {
    const sanitized = raw.replace(/[^\d\s]/g, "");
    const collapsed = sanitized.replace(/\s+/g, " ").slice(0, 23);
    setCardNumber(collapsed);

    const err = validateCardNumberRaw(collapsed);
    setErrors((prev) => ({ ...prev, cardNumber: err }));
  }

  function setCardNameLive(raw) {
    const sanitized = raw.replace(/[^A-Za-z\s\-'.]/g, "");
    setCardName(sanitized);
    const err = validateCardNameRaw(sanitized);
    setErrors((prev) => ({ ...prev, cardName: err }));
  }

  function setExpiryLive(raw) {
    const v = raw;
    setExpiry(v);
    const err = v ? validateExpiryRaw(v) : "Expiry required.";
    setErrors((prev) => ({ ...prev, expiry: err }));
  }

  function setCvvLive(raw) {
    const digits = String(raw).replace(/\D+/g, "").slice(0, 3);
    setCvv(digits);
    const err = validateCvvRaw(digits);
    setErrors((prev) => ({ ...prev, cvv: err }));
  }

  function setUpiLive(raw) {
    setUpiId(raw);
    const err = validateUpiRaw(raw);
    setErrors((prev) => ({ ...prev, upiId: err }));
  }

  function setNetbankLive(bankName, user, pass) {
    setBank(bankName);
    setNbUser(user);
    setNbPass(pass);
    const err = validateNetbankRaw(bankName, user, pass);
    setErrors((prev) => ({ ...prev, netbank: err }));
  }

  // ensure summary shows query param values when component mounts or params change
  useEffect(() => {
    // no-op: summary reads derived values directly
  }, [pricePerSeatParam, totalPriceParam, adultsParam, childrenParam, seatTypeParam]);

  async function handlePay(e) {
    e && e.preventDefault();
    clearErrors();
    setSuccess(null);
    setGlobalError("");

    // 1) Validate passengers first
    if (passengerRef && passengerRef.current) {
      const pRes = passengerRef.current.validate();
      if (!pRes.ok) {
        // set global error and stop
        setGlobalError("Fix passenger details before proceeding to payment.");
        // also mark an errors flag so UI can highlight
        setErrors((prev) => ({ ...prev, passengers: "Passenger details invalid" }));
        return;
      }
    }

    // 2) Validate payment fields as before
    const nextErrors = {};

    if (method === "card") {
      const cnErr = validateCardNumberRaw(cardNumber);
      if (cnErr) nextErrors.cardNumber = cnErr;
      const cvvErr = validateCvvRaw(cvv);
      if (cvvErr) nextErrors.cvv = cvvErr;
      const expErr = validateExpiryRaw(expiry);
      if (expErr) nextErrors.expiry = expErr;
      const nameErr = validateCardNameRaw(cardName);
      if (nameErr) nextErrors.cardName = nameErr;
    } else if (method === "upi") {
      const uErr = validateUpiRaw(upiId);
      if (uErr) nextErrors.upiId = uErr;
    } else if (method === "netbank") {
      const nbErr = validateNetbankRaw(bank, nbUser, nbPass);
      if (nbErr) nextErrors.netbank = nbErr;
    } else {
      nextErrors.method = "Select a payment method.";
    }

    setErrors((prev) => ({ ...prev, ...nextErrors }));
    if (Object.keys(nextErrors).length > 0) {
      setGlobalError("Fix the highlighted errors before continuing.");
      return;
    }

    // Mock submit
    setLoading(true);
    try {
      const payload = { method };

      // include passengers in payload (for demo)
      const passengers = passengerRef.current ? passengerRef.current.getPassengers() : [];

      if (method === "card") {
        payload.cardLast4 = String(cardNumber || "").replace(/\s+/g, "").slice(-4);
        payload.name = cardName;
        payload.expiry = expiry;
      } else if (method === "upi") {
        payload.upiId = upiId.trim();
      } else {
        payload.bank = bank;
        payload.user = nbUser;
      }
      payload.passengers = passengers;

      // simulate API call
      await new Promise((r) => setTimeout(r, 900));

      const bookingId = `BK${Date.now().toString().slice(-7)}`;
      setSuccess({ bookingId, payload });
    } catch (err) {
      console.error("payment error", err);
      setGlobalError("Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // Reset function - clears form and errors (also instruct PassengerForm to reset by re-mount)
  function handleReset() {
    setCardNumber("");
    setCardName("");
    setExpiry("");
    setCvv("");
    setUpiId("");
    setBank("");
    setNbUser("");
    setNbPass("");
    clearErrors();
    setSuccess(null);
    // reset passenger form by forcing a remount: (simple approach — replace ref usage by reloading via key)
    // easiest in this single-file approach: reload the page? but we won't reload; user can re-enter.
  }

  // derived values for UI
  const adults = adultsParam || 0;
  const children = childrenParam || 0;
  const totalPassengers = adults + children;
  const pricePerSeat = Number(pricePerSeatParam || 0);
  const computedTotal = Number(totalPriceParam || pricePerSeat * totalPassengers || 0);
  const seatLabel = seatTypeParam || "Any";

  return (
    <>
      <CustomerNavbar />
      <div className="pay-root">
        <div className="pay-container">
          <h2>Complete Payment</h2>

          <div className="pay-grid">
            {/* Left: passenger form + payment form */}
            <div style={{ flex: 1 }}>
              {/* Passenger form appears first */}
              <PassengerForm
                ref={passengerRef}
                adults={adults}
                children={children}
                onChange={(data) => {
                  // optional: you can persist to localStorage here
                  // console.log("passengers changed", data);
                }}
              />

              <form className="pay-form" onSubmit={handlePay} noValidate>
                <div className="pay-section">
                  <label className="pay-label">Payment Method</label>
                  <div className="pay-methods">
                    <label className={`method ${method === "card" ? "active" : ""}`}>
                      <input type="radio" name="method" value="card" checked={method === "card"} onChange={() => setMethod("card")} />
                      Card
                    </label>

                    <label className={`method ${method === "upi" ? "active" : ""}`}>
                      <input type="radio" name="method" value="upi" checked={method === "upi"} onChange={() => setMethod("upi")} />
                      UPI
                    </label>

                    <label className={`method ${method === "netbank" ? "active" : ""}`}>
                      <input type="radio" name="method" value="netbank" checked={method === "netbank"} onChange={() => setMethod("netbank")} />
                      Netbanking
                    </label>
                  </div>
                </div>

                {method === "card" && (
                  <div className="pay-section card-section">
                    <label className="pay-label">Card Number</label>
                    <input
                      className={`pay-input ${errors.cardNumber ? "err" : ""}`}
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumberLive(e.target.value)}
                      maxLength={23}
                      inputMode="numeric"
                    />
                    {errors.cardNumber && <div className="pay-error">{errors.cardNumber}</div>}

                    <label className="pay-label">Name on Card</label>
                    <input
                      className={`pay-input ${errors.cardName ? "err" : ""}`}
                      placeholder="Full name as on card"
                      value={cardName}
                      onChange={(e) => setCardNameLive(e.target.value)}
                    />
                    {errors.cardName && <div className="pay-error">{errors.cardName}</div>}

                    <div className="pay-row">
                      <div style={{ flex: 1 }}>
                        <label className="pay-label">Expiry (MM/YY)</label>
                        <input
                          className={`pay-input ${errors.expiry ? "err" : ""}`}
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={(e) => setExpiryLive(e.target.value)}
                          maxLength={7}
                        />
                        {errors.expiry && <div className="pay-error">{errors.expiry}</div>}
                      </div>

                      <div style={{ width: 140 }}>
                        <label className="pay-label">CVV</label>
                        <input
                          className={`pay-input ${errors.cvv ? "err" : ""}`}
                          placeholder="123"
                          value={cvv}
                          onChange={(e) => setCvvLive(e.target.value)}
                          maxLength={3}
                          inputMode="numeric"
                        />
                        {errors.cvv && <div className="pay-error">{errors.cvv}</div>}
                      </div>
                    </div>
                  </div>
                )}

                {method === "upi" && (
                  <div className="pay-section">
                    <label className="pay-label">UPI ID</label>
                    <input
                      className={`pay-input ${errors.upiId ? "err" : ""}`}
                      placeholder="example@bank"
                      value={upiId}
                      onChange={(e) => setUpiLive(e.target.value)}
                    />
                    {errors.upiId && <div className="pay-error">{errors.upiId}</div>}
                    <div className="small-note">Format: name@bank — letters only after '@'</div>
                  </div>
                )}

                {method === "netbank" && (
                  <div className="pay-section">
                    <label className="pay-label">Select Bank</label>
                    <select
                      className={`pay-input ${errors.netbank ? "err" : ""}`}
                      value={bank}
                      onChange={(e) => setNetbankLive(e.target.value, nbUser, nbPass)}
                    >
                      <option value="">Choose bank</option>
                      <option>HDFC</option>
                      <option>ICICI</option>
                      <option>SBI</option>
                      <option>Axis</option>
                      <option>Kotak</option>
                      <option>Others</option>
                    </select>
                    <div className="pay-row" style={{ marginTop: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label className="pay-label">Netbanking User ID</label>
                        <input
                          className="pay-input"
                          value={nbUser}
                          onChange={(e) => setNetbankLive(bank, e.target.value, nbPass)}
                        />
                      </div>
                      <div style={{ width: 160 }}>
                        <label className="pay-label">Password</label>
                        <input
                          className="pay-input"
                          type="password"
                          value={nbPass}
                          onChange={(e) => setNetbankLive(bank, nbUser, e.target.value)}
                        />
                      </div>
                    </div>
                    {errors.netbank && <div className="pay-error">{errors.netbank}</div>}
                  </div>
                )}

                {errors.passengers && <div className="pay-global-error">{errors.passengers}</div>}
                {globalError && <div className="pay-global-error">{globalError}</div>}

                <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                  <button className="pay-submit" type="submit" disabled={loading}>
                    {loading ? "Processing..." : "Pay Now"}
                  </button>

                  <button type="button" className="pay-cancel" onClick={handleReset}>
                    Reset
                  </button>
                </div>
              </form>
            </div>

            {/* Right: summary / result card */}
            <aside className="pay-summary">
              <div className="summary-card">
                <h3>Payment Summary</h3>

                <div className="summary-row">
                  <div>Price per seat</div>
                  <div className="muted">₹{pricePerSeat.toLocaleString()}</div>
                </div>

                <div className="summary-row">
                  <div>Passengers</div>
                  <div className="muted">
                    {adults} Passengers {adults !== 1 ? "s" : ""} {children} Child
                    {children !== 1 ? "ren" : ""}
                  </div>
                </div>

                <div className="summary-row">
                  <div>Seat Type</div>
                  <div className="muted">{seatLabel}</div>
                </div>

                <hr />

                <div className="summary-row" style={{ fontWeight: 800 }}>
                  <div>Total</div>
                  <div>₹{computedTotal.toLocaleString()}</div>
                </div>

                <hr />

                {!success && <div className="small-note">Fill passenger & payment details and click Pay Now to complete booking.</div>}

                {success && (
                  <div className="success-box">
                    <div className="success-title">Payment successful</div>
                    <div>Booking ID: <strong>{success.bookingId}</strong></div>
                    <div className="small-note">Saved payload: <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(success.payload, null, 2)}</pre></div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}