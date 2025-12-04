// Payment.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CustomerNavbar from "../customerNavbar/customerNavbar.jsx";
import "./payment.css";

const EMPTY = { type: "", message: "" };

export default function Payment(props) {
  const bp=localStorage.getItem("baseprice")
  const [searchParams] = useSearchParams();

  // read live pricing / passengers from query params (sent from booking)
  const flightNumber = searchParams.get("flightId") ?? props.flight.flightId;
  const passengers = props.passengers;
  const pricePerSeatParam = Number(searchParams.get("pricePerSeat") ?? 0);
  const totalPriceParam = Number(searchParams.get("totalPrice") ?? 0);
  const adultsParam = Number(searchParams.get("adults") ?? 0);
  const childrenParam = Number(searchParams.get("children") ?? 0);
  const seatTypeParam = searchParams.get("seatType") || searchParams.get("seat") || "";
  const passg=adultsParam+childrenParam;

  // new: read discounts from query params (support amounts like 500 or percentages like "10%")
  const rawDiscount = searchParams.get("discount") ?? ""; // generic discount
  const rawBulkDiscount = searchParams.get("bulkDiscount") ?? searchParams.get("bulk_discount") ?? "";
  const rawEarlyDiscount = searchParams.get("earlyDiscount") ?? searchParams.get("early_discount") ?? "";

  const [method, setMethod] = useState("card"); // card | upi | netbank
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [globalError, setGlobalError] = useState("");
  const [priceData, setPriceData] = useState({
    advanceDiscount: 0,
    basePrice: 0,
    bulkDiscount: 0,
    categoryDiscount: 0,
    finalPrice: 0
  });
  const [priceLoading, setPriceLoading] = useState(false);

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

  useEffect(() => {
    async function loadPaymentStats() {
      setPriceLoading(true);
      try {
        const res = await fetch("http://localhost:4000/api/bookings/calculatePrice", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({
            flightNumber: flightNumber,
            type: seatTypeParam.toLowerCase(),
            quantity: passg
          })
        });
        
        const data = await res.json();
        setPriceData(data.data);
        console.log(data.data);
      } catch(err) { console.log(err.message) }
      finally {
        setPriceLoading(false);
      }
    }
    loadPaymentStats();
  }, []);

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
    // no-op here — state derived directly from query params
  }, [pricePerSeatParam, totalPriceParam, adultsParam, childrenParam, seatTypeParam, rawDiscount, rawBulkDiscount, rawEarlyDiscount]);

  // --- Helper: parse discount which can be "100" or "10%" ---
  function parseDiscountValue(rawValue, baseForPercent = 0) {
    if (!rawValue && rawValue !== 0) return 0;
    const s = String(rawValue).trim();
    if (!s) return 0;
    if (s.endsWith("%")) {
      const pct = parseFloat(s.slice(0, -1));
      if (isNaN(pct)) return 0;
      return (pct / 100) * baseForPercent;
    }
    const n = Number(s);
    return isNaN(n) ? 0 : n;
  }

  // --- Pricing multipliers depending on seat type ---
  function seatMultiplier(seatStr) {
    const s = String(seatStr || "").trim().toLowerCase();
    if (s === "executive") return 1.5;
    if (s === "business") return 2.25;
    // treat anything else (including "economy") as 1
    return 1;
  }

  // derived values for UI
  const adults = adultsParam || 0;
  const children = childrenParam || 0;
  const totalPassengers = adults + children;
  const basePrice = Number(pricePerSeatParam || 0); // base flight price from API (e.g., 5000)
  const multiplier = seatMultiplier(seatTypeParam || "");
  const perSeatPrice = Number((basePrice * multiplier) || 0); // final price per passenger for chosen seat type
  const baseTotal = basePrice * totalPassengers; // base fare total (basePrice * passengers)
  const overheadPerSeat = Math.max(0, perSeatPrice - basePrice);
  const overheadTotal = overheadPerSeat * totalPassengers;
  const subtotal = baseTotal + overheadTotal;

  // parse discounts: if percentage (eg "10%") it's applied to subtotal; otherwise absolute amount
  const discountAmount = parseDiscountValue(rawDiscount, subtotal);
  const bulkDiscountAmount = parseDiscountValue(rawBulkDiscount, subtotal);
  const earlyDiscountAmount = parseDiscountValue(rawEarlyDiscount, subtotal);

  // clamp discounts so total doesn't go negative
  const totalDiscounts = Math.max(0, discountAmount + bulkDiscountAmount + earlyDiscountAmount);
  const totalPaidRaw = Math.max(0, subtotal - totalDiscounts);

  // legacy computedTotal fallback (keeps previous behavior if API provided totalPrice)
  const computedTotal = Number(totalPriceParam || perSeatPrice * totalPassengers || 0);
  const seatLabel = seatTypeParam || "Any";

  // formatting helper
  const fmt = (v) =>
    typeof v === "number" ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : v;

  async function handlePay(e) {
    e && e.preventDefault();
    clearErrors();
    setSuccess(null);
    setGlobalError("");

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

  // Reset function - clears form and errors
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
  }

  return (
    <>
      <CustomerNavbar />
      <div className="pay-root">
        <div className="pay-container">
          <h2>Complete Payment</h2>

          <div className="pay-grid">
            {/* Left: payment form */ }
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
                    maxLength={16}
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

            {/* Right: summary / result card */}
            {!priceLoading && (<aside className="pay-summary">
              <div className="summary-card">
                <h3>Payment Summary</h3>

                <div className="summary-row">
                  <div>Base flight price</div>
                  <div className="muted">₹{priceData.basePrice/passg}</div>
                </div>

                <div className="summary-row">
                  <div>Seat Type</div>
                  <div className="muted">{seatLabel} (×{multiplier})</div>
                </div>

                <div className="summary-row">
                  <div>Per-seat price (after multiplier)</div>
                  <div className="muted">₹{priceData.basePrice}</div>
                </div>

                <div className="summary-row">
                  <div>Passengers</div>
                  <div className="muted">{passg}</div>
                </div>

                <hr />

                <div className="summary-row">
                  <div>Category Discount</div>
                  <div className="muted">- ₹{priceData.categoryDiscount}</div>
                </div>

                <div className="summary-row">
                  <div>Bulk Discount</div>
                  <div className="muted">- ₹{priceData.bulkDiscount}</div>
                </div>

                <div className="summary-row">
                  <div>Early Discount</div>
                  <div className="muted">- ₹{priceData.advanceDiscount}</div>
                </div>

                <hr />

                <div className="summary-row" style={{ fontWeight: 800 }}>
                  <div>TOTAL PAID</div>
                  <div>₹{priceData.finalPrice}</div>
                </div>

                <hr />

                <div className="summary-row">
                  <div>Legacy computed total</div>
                  <div className="muted">₹{fmt(computedTotal)}</div>
                </div>

                <hr />

                {!success && <div className="small-note">Fill payment details and click Pay Now to complete booking.</div>}

                {success && (
                  <div className="success-box">
                    <div className="success-title">Payment successful</div>
                    <div>Booking ID: <strong>{success.bookingId}</strong></div>
                    <div className="small-note">Saved payment: {JSON.stringify(success.payload)}</div>
                  </div>
                )}
              </div>
            </aside> )}
          </div>
        </div>
      </div>
    </>
  );
}