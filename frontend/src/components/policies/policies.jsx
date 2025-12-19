// Policies.jsx
import React, { useEffect, useState } from "react";
import CustomerNavbar from "../customerNavbar/customerNavbar";
import "./policies.css";

const CLASS_OVERHEAD = {
  economy: 0,
  executive: 0.25,
  business: 0.5,
};

// --- Helpers (unchanged logic except where noted) ---
function calculateFare(basePrice, travelClass = "economy") {
  const overhead = CLASS_OVERHEAD[travelClass] ?? 0;
  return (basePrice * (1 + overhead));
}

function applyDiscount(fare, discount = null) {
  if (!discount) return fare;
  const { type = "percent", value = 0, minFare = 0, maxDiscountAmount = Infinity } = discount;
  if (fare < minFare) return fare;
  let discounted = fare;
  if (type === "percent") {
    discounted = fare - ((fare * value) / 100);
  } else {
    discounted = fare - (value);
  }
  if (fare - discounted > maxDiscountAmount) {
    discounted = fare - (maxDiscountAmount);
  }
  return Math.max(discounted, 0);
}

function computeRefundAmount(fare, policyRefund = {}) {
  // policyRefund expects:
  // { refundable: boolean, penaltyPercent: <integer percent 0-100>, minPenaltyFlat: number }
  const { refundable = false, penaltyPercent = 100, minPenaltyFlat = 0 } = policyRefund;
  if (!refundable) return 0;
  const penalty = Math.max(((fare * penaltyPercent) / 100), (minPenaltyFlat));
  return Math.max(fare - penalty, 0);
}

function normalizeDiscounts(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object") {
    return Object.entries(raw).map(([k, v]) => {
      if (typeof v === "number") {
        return { id: k, desc: k, type: "percent", value: v };
      } else if (typeof v === "object") {
        return { id: k, desc: v.desc ?? k, ...v };
      } else {
        return { id: k, desc: String(v), type: "percent", value: 0 };
      }
    });
  }
  return [];
}

function normalizeRefunds(rawRefunds) {
  if (!rawRefunds) return [];
  if (Array.isArray(rawRefunds)) return rawRefunds;
  if (typeof rawRefunds === "object") {
    const rules = [];
    Object.entries(rawRefunds).forEach(([k, v]) => {
      const numMatch = k.match(/(\d{1,4})/);
      let days = numMatch ? parseInt(numMatch[1], 10) : -1;
      let penaltyPercent = 100;

      if (typeof v === "number") {
        // Accept either 0.01 (fraction) or 1 (percent)
        if (v > 0 && v <= 1) penaltyPercent = (v * 100);
        else penaltyPercent = (v);
      } else if (typeof v === "object") {
        // If penaltyPercent exists and is fractional (0 < p <= 1) convert to percent
        if (v.penaltyPercent != null) {
          let pp = v.penaltyPercent;
          if (typeof pp === "number") {
            if (pp > 0 && pp <= 1) pp = (pp * 100);
            else pp = (pp);
            penaltyPercent = pp;
          }
        } else {
          // fallback if object numeric value provided differently
          if (typeof v === "number" && v > 0 && v <= 1) penaltyPercent = (v * 100);
        }
      }

      // attach forClass if present (string like "business" or "executive")
      const forClass = typeof v === "object" && v?.forClass ? v.forClass : undefined;

      rules.push({ daysBefore: days, penaltyPercent, rawKey: k, forClass });
    });

    // sort rules: larger daysBefore first; -1 (fallback) last
    rules.sort((a, b) => {
      if (a.daysBefore === -1) return 1;
      if (b.daysBefore === -1) return -1;
      return b.daysBefore - a.daysBefore;
    });

    return rules;
  }
  return [];
}

function getPenaltyPercentFromRules(refundRules, daysBefore, travelClass) {
  if (!refundRules || refundRules.length === 0) return 100;

  // first try class-specific rule
  for (const r of refundRules) {
    if (r.forClass && r.forClass === travelClass && r.penaltyPercent != null) return r.penaltyPercent;
  }

  // then general daysBefore rules (they are sorted descending)
  for (const r of refundRules) {
    if (r.daysBefore === -1) continue;
    if (daysBefore >= r.daysBefore) return r.penaltyPercent;
  }

  // fallback rule with daysBefore === -1 (catch-all)
  const fallback = refundRules.find((x) => x.daysBefore === -1);
  if (fallback) return fallback.penaltyPercent;

  return 100;
}

// --- Component using explicit URL fetch ---
export default function Policies() {
  const [carriers, setCarriers] = useState([]);
  const [openMap, setOpenMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // baseFareMap: { [carrierId]: number }
  const [baseFareMap, setBaseFareMap] = useState({});

  // attach Bearer token from localStorage if present
  function getAuthHeaders() {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken") || null;
    if (token) return { Authorization: `Bearer ${token}` };
    return {};
  }

  useEffect(() => {
    let mounted = true;

    async function fetchCarriers() {
      setLoading(true);
      setError(null);
      try {
        const headers = { "Content-Type": "application/json", ...getAuthHeaders() };
        const resp = await fetch("http://localhost:4000/api/carriers/list", { headers });
        if (!resp.ok) throw new Error(`API error ${resp.status}`);
        const body = await resp.json();

        // Accept either { data: [...] } or [...] directly
        let items = [];
        if (Array.isArray(body)) items = body;
        else if (Array.isArray(body.data)) items = body.data;
        else {
          // try to find first array value inside body
          const arrVal = Object.values(body).find((v) => Array.isArray(v));
          if (arrVal) items = arrVal;
          else throw new Error("Unexpected response shape from /api/list");
        }

        if (!mounted) return;

        const normalized = items.map((c) => {
          const id = c.CarrierId ?? c.carrierId ?? c.id ?? Math.random().toString(36).slice(2, 9);
          const name = c.CarrierName ?? c.name ?? c.carrierName ?? "Unknown Carrier";
          const discounts = normalizeDiscounts(c.Discounts ?? c.discounts ?? c.userDiscounts ?? c.userdiscounts);
          const refundRules = normalizeRefunds(c.Refunds ?? c.refunds ?? c.refundPolicy ?? c.Refunds);
          const baggage = c.baggage ?? c.Baggage ?? null;
          const checkIn = c.checkIn ?? c.CheckIn ?? null;
          const changePolicy = c.changePolicy ?? c.ChangePolicy ?? null;
          const basePriceExample = c.basePriceExample ?? c.BasePriceExample ?? c.basePrice ?? 5000;

          return {
            raw: c,
            id,
            name,
            discounts,
            refundRules,
            baggage,
            checkIn,
            changePolicy,
            basePriceExample,
          };
        });

        // initialize baseFareMap from normalized carriers
        const initialBaseFare = {};
        normalized.forEach((n) => {
          initialBaseFare[n.id] = Number(n.basePriceExample) || 0;
        });

        setCarriers(normalized);
        setBaseFareMap(initialBaseFare);
      } catch (err) {
        console.error("Failed to fetch carriers", err);
        if (mounted) setError(err.message || "Failed to load carriers");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchCarriers();

    return () => {
      mounted = false;
    };
  }, []);

  function toggle(id) {
    setOpenMap((p) => ({ ...p, [id]: !p[id] }));
  }

  function setBaseFareForCarrier(id, rawValue) {
    // allow empty / invalid -> treat as 0; keep numeric precision
    const v = rawValue === "" ? "" : rawValue;
    // If empty string, store as empty so input can be cleared; otherwise number
    setBaseFareMap((prev) => ({ ...prev, [id]: v === "" ? "" : Number(Number(v)) }));
  }

  if (loading) {
    return (
      <div className="policies-container">
        <h3 className="policies-title">Loading carriers…</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="policies-container">
        <h3 className="policies-title">Error loading carriers</h3>
        <div className="muted small">{error}</div>
      </div>
    );
  }

  return (
    <>
      <CustomerNavbar />
      <div className="policies-container">
        <h2 className="policies-title">Policies</h2>

        <div className="airlines-list">
          {carriers.map((airline) => {
            // read editable base fare (fallback to example if empty)
            const rawBase = baseFareMap[airline.id];
            const baseFare =
              rawBase === "" || rawBase == null ? Number(airline.basePriceExample || 0) : Number(rawBase);

            return (
              <div key={airline.id} className="airline-card">
                <div className="airline-header">
                  <div>
                    <h3 className="airline-name">
                      <strong style={{ color: "black" }}>{airline.name}</strong>
                    </h3>
                  </div>
                  <div className="airline-actions">
                    <button
                      className="btn btn-compact"
                      style={{background: "#397367"}}
                      onClick={() => toggle(airline.id)}
                      aria-expanded={!!openMap[airline.id]}
                    >
                      {openMap[airline.id] ? "Hide" : "View"}
                    </button>
                  </div>
                </div>

                {openMap[airline.id] && (
                  <div className="airline-body">
                    <section className="policy-section">
                      <h4>General</h4>
                      <ul>
                        <li>Customer support & carrier data from API (inspect raw object for full details).</li>
                        <li>Baggage: {airline.baggage ? JSON.stringify(airline.baggage) : "Standard policy (15 KGs)"}.</li>
                        <li>Check-in: {airline.checkIn ? JSON.stringify(airline.checkIn) : "Standard (2 hours before)"}.</li>
                        <li>base fare, business = base fare * 1.5, executive = 2.25 * base fare </li>
                        {/* <li>Check-in: {airline.checkIn ? JSON.stringify(airline.checkIn) : "Standard (2 hours before)"}.</li> */}
                      </ul>
                    </section>

                    <section className="policy-section">
                      <h4>Fares & Class Overhead</h4>
                      <div style={{"background":"rgb(255, 248, 235)"}} className="fare-examples">
                        <div className="fare-row" style={{ alignItems: "center", gap: "0.75rem" }}>
                          <span>Enter Price Paid (Example):</span>
                          <div>
                            <input
                              type="number"
                              min="0"
                              max="150000"
                              step="1"
                              className="base-fare-input"
                              value={baseFareMap[airline.id] === "" ? "" : baseFareMap[airline.id]}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (Number(val) < 0) {
                                  alert("Base Fare cannot be less than 0");
                                  setBaseFareForCarrier(0);
                                }
                                else if (val.length <= 7)
                                  setBaseFareForCarrier(airline.id, val);
                                else {
                                  alert("Base Fare cannot exceed 150000");
                                }
                              }
                            }
                              aria-label={`Base fare for ${airline.name}`}
                              style={{ width: "120px", padding: "6px" }}
                            />
                          </div>
                        </div>

                        {/* <div className="fare-row small" style={{ marginTop: "0.5rem" }}>
                          <div>Economy: ₹{calculateFare(baseFare, "economy")}</div>
                          <div>Executive: ₹{calculateFare(baseFare, "executive")}</div>
                          <div>Business: ₹{calculateFare(baseFare, "business")}</div>
                        </div> */}
                        {/* <div className="note">Overheads: economy +0%, executive +25%, business +50% (consistent across carriers).</div> */}
                      </div>
                    </section>

                    <section className="policy-section">
                      <h4>Discounts</h4>
                      <div className="discounts">
                        {airline.discounts && airline.discounts.length ? (
                          <table className="policy-table">
                            <thead>
                              <tr>
                                <th style={{ "background": "#B3BFFF" }}>Discount Criteria</th>
                                <th style={{ "background": "#B3BFFF" }}>Refund</th>
                                <th style={{ "background": "#B3BFFF" }}>Example</th>
                                {/* <th style={{ "background": "#B3BFFF" }}>Example (Executive)</th>
                                <th style={{ "background": "#B3BFFF" }}>Example (Business)</th> */}
                              </tr>
                            </thead>
                            <tbody>
                              {airline.discounts.map((d) => {
                                const type = d.type ?? (d.value && d.value <= 100 ? "percent" : "percent");
                                const value = d.value ?? (typeof d === "number" ? d : 0);

                                const fareE = calculateFare(baseFare, "economy");
                                const fareX = calculateFare(baseFare, "executive");
                                const fareB = calculateFare(baseFare, "business");

                                const exampleE = applyDiscount(fareE, {
                                  type,
                                  value,
                                  minFare: d.minFare,
                                  maxDiscountAmount: d.maxDiscountAmount,
                                });
                                const exampleX = applyDiscount(fareX, {
                                  type,
                                  value,
                                  minFare: d.minFare,
                                  maxDiscountAmount: d.maxDiscountAmount,
                                });
                                const exampleB = applyDiscount(fareB, {
                                  type,
                                  value,
                                  minFare: d.minFare,
                                  maxDiscountAmount: d.maxDiscountAmount,
                                });

                                const offE = fareE - exampleE;
                                const offX = fareX - exampleX;
                                const offB = fareB - exampleB;

                                return (
                                    <tr key={d.id ?? d.desc}>
                                        <td>
                                            {d.desc ??
                                                `${value}${
                                                    type === "percent"
                                                        ? "%"
                                                        : " fixed"
                                                }`}
                                        </td>
                                        <td>{d.value} %</td>
                                        {offE > 0 ? (
                                            <td>₹{offE.toFixed(2)} OFF</td>
                                        ) : (
                                            <td>Invalid Base Fare</td>
                                        )}
                                        {/* <td>₹{offX} OFF (₹{exampleX})</td>
                                    <td>₹{offB} OFF (₹{exampleB})</td> */}
                                    </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                          <div className="muted">No discount schemes available.</div>
                        )}
                      </div>
                    </section>

                    <section className="policy-section">
                      <h4>Refunds & Cancellations</h4>
                      <div className="refunds">
                        {airline.refundRules && airline.refundRules.length ? (
                          <>
                            <table className="policy-table">
                              <thead >
                                <tr >
                                  <th style={{ "background": "coral" }}>Scenario</th>
                                  <th style={{ "background": "coral" }}>Refund</th>
                                  <th style={{ "background": "coral" }}>Example</th>
                                  {/* <th style={{ "background": "coral" }}>Example (Executive)</th>
                                  <th style={{ "background": "coral" }}>Example (Business)</th> */}
                                </tr>
                              </thead>
                              <tbody>
                                {[20, 10, 2].map((daysBefore) => {
                                  const fareE = calculateFare(baseFare, "economy");
                                  const fareX = calculateFare(baseFare, "executive");
                                  const fareB = calculateFare(baseFare, "business");

                                  const penaltyE = getPenaltyPercentFromRules(airline.refundRules, daysBefore, "economy");
                                  const penaltyX = getPenaltyPercentFromRules(airline.refundRules, daysBefore, "executive");
                                  const penaltyB = getPenaltyPercentFromRules(airline.refundRules, daysBefore, "business");

                                  const minPenaltyFlat = airline.raw?.minPenaltyFlat ?? airline.raw?.Refunds?.minPenaltyFlat ?? 0;

                                  const refundE = computeRefundAmount(fareE, {
                                    refundable: penaltyE < 100,
                                    penaltyPercent: penaltyE,
                                    minPenaltyFlat,
                                  });
                                  const refundX = computeRefundAmount(fareX, {
                                    refundable: penaltyX < 100,
                                    penaltyPercent: penaltyX,
                                    minPenaltyFlat,
                                  });
                                  const refundB = computeRefundAmount(fareB, {
                                    refundable: penaltyB < 100,
                                    penaltyPercent: penaltyB,
                                    minPenaltyFlat,
                                  });

                                  const penaltySummary =
                                    penaltyE === penaltyX && penaltyX === penaltyB
                                      ? `${penaltyE}%`
                                      : `${penaltyE}% / ${penaltyX}% / ${penaltyB}%`;

                                  return (
                                      <tr key={daysBefore}>
                                          <td>
                                              Cancel {daysBefore} days before
                                          </td>
                                          <td>{penaltySummary}</td>
                                          {fareE - refundE > 0 ? (
                                              <td>
                                                  ₹
                                                  {(fareE - refundE).toFixed(2)}{" "}
                                                  from ₹{fareE.toFixed(2)}
                                              </td>
                                          ) : (
                                              <td>Invalid Base Fare</td>
                                          )}
                                          {/* <td>₹{fareX - refundX} from ₹{fareX}</td>
                                      <td>₹{fareB - refundB} from ₹{fareB}</td> */}
                                      </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </>
                        ) : (
                          <div className="muted">No refund rules provided by carrier.</div>
                        )}
                      </div>
                    </section>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}