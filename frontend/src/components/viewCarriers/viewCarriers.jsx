import React, { useEffect, useState } from "react";
import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
import "./viewCarriers.css";

export default function ViewCarriers() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterName, setFilterName] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:4000/api/carriers/list", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        console.log(data);
        if (!res.ok) throw new Error("Failed to fetch carriers");
        if (!mounted) return;
        setCarriers(Array.isArray(data.data) ? data.data : []);
        console.log(carriers);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Error");
        setCarriers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const names = Array.from(
    new Set(
      carriers
        .map((c) => (c.CarrierName || c.name || "").trim())
        .filter(Boolean)
    )
  ).sort();

  const rows = carriers.filter((c) => {
    if (!filterName) return true;
    const name = (c.CarrierName || c.name || "").toLowerCase();
    return name === filterName.toLowerCase();
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f6f9fc",
      }}
    >
      <AdminNavBar />
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          margin: "24px auto",
          background: "#fff",
          padding: 18,
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(9,30,66,0.04)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Carriers</h2>

        <div className="vc-controls">
          <label className="vc-filter-label">Filter by Carrier</label>
          <select
            className="vc-filter"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          >
            <option value="">All carriers</option>
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="vc-empty">Loading carriers…</div>
        ) : error ? (
          <div className="vc-empty">Error: {error}</div>
        ) : rows.length === 0 ? (
          <div className="vc-empty">No carriers found.</div>
        ) : (
          <div className="vc-table-wrap">
            <table className="vc-table">
              <thead>
                <tr>
                  <th>Carrier ID</th>
                  <th>Carrier Name</th>
                  <th>Discount 30 Days (%)</th>
                  <th>Discount 60 Days (%)</th>
                  <th>Discount 90 Days (%)</th>
                  <th>Bulk Booking (%)</th>
                  <th>Silver (%)</th>
                  <th>Gold (%)</th>
                  <th>Platinum (%)</th>
                  <th>Refund 2 Days (%)</th>
                  <th>Refund 10 Days (%)</th>
                  <th>Refund 20+ Days (%)</th>
                  {/* <th>Actions</th> */}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const id = c.CarrierId || c.id || c.CarrierID || "-";
                  const name = c.CarrierName || c.name || "-";
                  const discounts = c.Discounts || c.Discount || {};
                  const userDiscounts = c.userDiscounts || {};
                  const refunds = c.Refunds || {};

                  return (
                    <tr key={id}>
                      <td>{id}</td>
                      <td>{name}</td>
                      <td>
                        {discounts["30DaysAdvanceBooking"] ??
                          discounts["30"] ??
                          "-"}
                      </td>
                      <td>
                        {discounts["60DaysAdvanceBooking"] ??
                          discounts["60"] ??
                          "-"}
                      </td>
                      <td>
                        {discounts["90DaysAdvanceBooking"] ??
                          discounts["90"] ??
                          "-"}
                      </td>
                      <td>{discounts["BulkBooking"] ?? "-"}</td>
                      <td>
                        {userDiscounts.Silver ?? userDiscounts.silver ?? "-"}
                      </td>
                      <td>{userDiscounts.Gold ?? userDiscounts.gold ?? "-"}</td>
                      <td>
                        {userDiscounts.Platinum ??
                          userDiscounts.platinum ??
                          "-"}
                      </td>
                      <td>
                        {refunds["2DaysBeforeTravelDate"] ??
                          refunds["2"] ??
                          "-"}
                      </td>
                      <td>
                        {refunds["10DaysBeforeTravelDate"] ??
                          refunds["10"] ??
                          "-"}
                      </td>
                      <td>
                        {refunds["20DaysOrMoreBeforeTravelDate"] ??
                          refunds["20Plus"] ??
                          "-"}
                      </td>
                      {/* <td>
                        <button
                          className="vc-btn"
                          onClick={() =>
                            window.location.assign(`/admin/carriers/${id}`)
                          }
                        >
                          View
                        </button>
                      </td> */}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
