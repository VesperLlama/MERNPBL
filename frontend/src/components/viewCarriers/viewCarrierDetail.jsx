import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
import "./viewCarriers.css";

export default function ViewCarrierDetail() {
  const { id } = useParams();
  const [carrier, setCarrier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // try direct fetch first
        let res = await fetch(`/api/carriers/${id}`);
        let data;
        if (res.ok) {
          data = await res.json();
        } else {
          // fallback: fetch list and find item by id
          res = await fetch(`/api/carriers`);
          if (!res.ok) throw new Error("Failed to fetch carriers");
          const list = await res.json();
          data = (list || []).find((c) => {
            const cid = c.carrierId || c.id || c.carrierID;
            return String(cid) === String(id);
          });
        }

        if (!mounted) return;
        if (!data) {
          setError("Carrier not found");
          setCarrier(null);
        } else {
          setCarrier(data);
          setError(null);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Error");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f6f9fc" }}>
      <AdminNavBar />
      <div style={{ width: "100%", maxWidth: 1000, margin: "28px auto", background: "#fff", padding: 18, borderRadius: 10 }}>
        <div className="vc-empty">Loading carrier…</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f6f9fc" }}>
      <AdminNavBar />
      <div style={{ width: "100%", maxWidth: 1000, margin: "28px auto", background: "#fff", padding: 18, borderRadius: 10 }}>
        <div className="vc-empty">Error: {error}</div>
      </div>
    </div>
  );

  const c = carrier;
  const idVal = c.carrierId || c.id || c.carrierID || "-";
  const discounts = c.discounts || c.discount || {};
  const userDiscounts = c.userDiscounts || c.userDiscount || {};
  const refunds = c.refunds || {};

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f6f9fc" }}>
      <AdminNavBar />
      <div style={{ width: "100%", maxWidth: 1000, margin: "28px auto", background: "#fff", padding: 18, borderRadius: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{c.carrierName || c.name || "Carrier Details"}</h2>
          <div>
            <button onClick={() => navigate(-1)} style={{ marginRight: 8 }}>Back</button>
            <button onClick={() => navigate("/admin/carriers")} className="primary">View All</button>
          </div>
        </div>

        <table className="vc-table">
          <tbody>
            <tr><th>Carrier ID</th><td>{idVal}</td></tr>
            <tr><th>Carrier Name</th><td>{c.carrierName || c.name}</td></tr>
            <tr><th>Discount 30 Days</th><td>{discounts["30DaysAdvanceBooking"] ?? discounts["30"] ?? "-"}</td></tr>
            <tr><th>Discount 60 Days</th><td>{discounts["60DaysAdvanceBooking"] ?? discounts["60"] ?? "-"}</td></tr>
            <tr><th>Discount 90 Days</th><td>{discounts["90DaysAdvanceBooking"] ?? discounts["90"] ?? "-"}</td></tr>
            <tr><th>Bulk Booking Discount</th><td>{discounts["BulkBooking"] ?? "-"}</td></tr>
            <tr><th>Silver Discount</th><td>{userDiscounts.Silver ?? userDiscounts.silver ?? "-"}</td></tr>
            <tr><th>Gold Discount</th><td>{userDiscounts.Gold ?? userDiscounts.gold ?? "-"}</td></tr>
            <tr><th>Platinum Discount</th><td>{userDiscounts.Platinum ?? userDiscounts.platinum ?? "-"}</td></tr>
            <tr><th>Refund 2 Days</th><td>{refunds["2DaysBeforeTravelDate"] ?? refunds["2"] ?? "-"}</td></tr>
            <tr><th>Refund 10 Days</th><td>{refunds["10DaysBeforeTravelDate"] ?? refunds["10"] ?? "-"}</td></tr>
            <tr><th>Refund 20+ Days</th><td>{refunds["20DaysOrMoreBeforeTravelDate"] ?? refunds["20Plus"] ?? "-"}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
