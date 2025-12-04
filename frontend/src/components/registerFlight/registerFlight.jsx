// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
// import "./registerFlight.css";

// const carrierOptions = [
//   "IndiGo",
//   "Air India",
//   "SpiceJet",
//   "Vistara",
//   "Air India Express",
//   "Akasa Air",
//   "Alliance Air"
// ];

// const placeRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

// export default function RegisterFlight() {
//   const [form, setForm] = useState({
//     carrierName: "",
//     origin: "",
//     destination: "",
//     airFare: "",
//     seatsBusiness: "",
//     seatsEconomy: "",
//     seatsExecutive: ""
//   });

//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});
//   const [submitting, setSubmitting] = useState(false);
//   const [submitted, setSubmitted] = useState(false);
//   const navigate = useNavigate();

//   function setErr(k, msg) {
//     setErrors((e) => {
//       const ne = { ...e };
//       if (msg) ne[k] = msg;
//       else delete ne[k];
//       return ne;
//     });
//   }

//   function validateField(name) {
//     const v = (form[name] || "").toString().trim();
//     switch (name) {
//       case "carrierName":
//         if (!v) setErr(name, "Carrier is required");
//         else setErr(name, null);
//         break;
//       case "origin":
//       case "destination":
//         if (!v) setErr(name, "This field is required");
//         else if (!placeRegex.test(v)) setErr(name, "Only letters and single spaces allowed");
//         else setErr(name, null);
//         break;
//       case "airFare": {
//         if (v === "") setErr(name, "AirFare is required");
//         else {
//           const n = Number(v);
//           if (Number.isNaN(n) || n < 2000 || n > 150000) setErr(name, "Enter fare between 2000 and 150000");
//           else setErr(name, null);
//         }
//         break;
//       }
//       case "seatsBusiness":
//         validateIntRange(name, v, 10, 30);
//         break;
//       case "seatsEconomy":
//         validateIntRange(name, v, 50, 70);
//         break;
//       case "seatsExecutive":
//         validateIntRange(name, v, 3, 8);
//         break;
//       default:
//         break;
//     }
//   }

//   function validateIntRange(name, v, min, max) {
//     if (v === "") {
//       setErr(name, "This field is required");
//       return;
//     }
//     const n = Number(v);
//     if (!Number.isInteger(n) || n < min || n > max) setErr(name, `Enter integer between ${min} and ${max}`);
//     else setErr(name, null);
//   }

//   function handleChange(e) {
//     const { name, value } = e.target;
//     setForm((f) => ({ ...f, [name]: value }));
//     if (touched[name]) validateField(name);
//   }

//   function handleBlur(e) {
//     const { name } = e.target;
//     setTouched((t) => ({ ...t, [name]: true }));
//     validateField(name);
//   }

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setSubmitted(true);
//     Object.keys(form).forEach((k) => validateField(k));
//     await new Promise((r) => setTimeout(r, 10));
//     if (Object.keys(errors).length > 0) return;

//     setSubmitting(true);
//     try {
//       const payload = {
//         carrierName: form.carrierName,
//         origin: form.origin,
//         destination: form.destination,
//         airFare: Number(form.airFare),
//         seats: {
//           business: Number(form.seatsBusiness),
//           economy: Number(form.seatsEconomy),
//           executive: Number(form.seatsExecutive)
//         }
//       };

//       const res = await fetch("http://localhost:4000/api/flights/add", {
//         method: "POST",
//         headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
//         body: JSON.stringify(payload)
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);
//       const id = data.flightId || data.id || data.flightNumber;
//       if (id) alert(`Flight registered successfully. Flight ID: ${id}`);
//       else alert("Flight registered successfully.");

//       setForm({ carrierName: "", origin: "", destination: "", airFare: "", seatsBusiness: "", seatsEconomy: "", seatsExecutive: "" });
//       setTouched({});
//       setErrors({});
//       setSubmitted(false);
//     } catch (err) {
//       alert("Failed to register flight: " + err.message);
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f3f7fb" }}>
//       <AdminNavBar />
//       <div style={{ width: "100%", maxWidth: 980, margin: "28px auto", background: "#fff", padding: 22, borderRadius: 12, boxShadow: "0 10px 30px rgba(9,30,66,0.06)" }}>
//         <h2>Register Flight</h2>
//         <p className="required-note">Fields marked <span className="req">*</span> are required</p>

//         <form onSubmit={handleSubmit}>
//           <div className="grid">
//             <div className="col">
//               <label className="required">Carrier Name</label>
//               <select name="carrierName" value={form.carrierName} onChange={handleChange} onBlur={handleBlur}>
//                 <option value="">Select carrier</option>
//                 {carrierOptions.map((c) => <option key={c} value={c}>{c}</option>)}
//               </select>
//               {errors.carrierName && (touched.carrierName || submitted) && <div className="error">{errors.carrierName}</div>}
//             </div>

//             <div className="col">
//               <label className="required">Origin</label>
//               <input name="origin" value={form.origin} onChange={handleChange} onBlur={handleBlur} placeholder="City/Airport" />
//               {errors.origin && (touched.origin || submitted) && <div className="error">{errors.origin}</div>}
//             </div>

//             <div className="col">
//               <label className="required">Destination</label>
//               <input name="destination" value={form.destination} onChange={handleChange} onBlur={handleBlur} placeholder="City/Airport" />
//               {errors.destination && (touched.destination || submitted) && <div className="error">{errors.destination}</div>}
//             </div>

//             <div className="col">
//               <label className="required">Air Fare (INR)</label>
//               <input name="airFare" value={form.airFare} onChange={handleChange} onBlur={handleBlur} type="number" min="2000" max="150000" placeholder="2000 - 150000" />
//               {errors.airFare && (touched.airFare || submitted) && <div className="error">{errors.airFare}</div>}
//             </div>

//             <div className="col">
//               <label className="required">Seat Capacity - Business Class</label>
//               <input name="seatsBusiness" value={form.seatsBusiness} onChange={handleChange} onBlur={handleBlur} type="number" min="10" max="30" placeholder="10 - 30" />
//               {errors.seatsBusiness && (touched.seatsBusiness || submitted) && <div className="error">{errors.seatsBusiness}</div>}
//             </div>

//             <div className="col">
//               <label className="required">Seat Capacity - Economy Class</label>
//               <input name="seatsEconomy" value={form.seatsEconomy} onChange={handleChange} onBlur={handleBlur} type="number" min="50" max="70" placeholder="50 - 70" />
//               {errors.seatsEconomy && (touched.seatsEconomy || submitted) && <div className="error">{errors.seatsEconomy}</div>}
//             </div>

//             <div className="col">
//               <label className="required">Seat Capacity - Executive Class</label>
//               <input name="seatsExecutive" value={form.seatsExecutive} onChange={handleChange} onBlur={handleBlur} type="number" min="3" max="8" placeholder="3 - 8" />
//               {errors.seatsExecutive && (touched.seatsExecutive || submitted) && <div className="error">{errors.seatsExecutive}</div>}
//             </div>
//           </div>

//           <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
//             <button className="primary" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Register Flight"}</button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
// import "./registerFlight.css";

// const carrierOptions = [
//   "IndiGo",
//   "Air India",
//   "SpiceJet",
//   "Vistara",
//   "Air India Express",
//   "Akasa Air",
//   "Alliance Air"
// ];
// const airports =
// ["DEL (Delhi)", "BOM (Mumbai)", "VNS (Varanasi)", "LKO (Lucknow)", "TRV (Trivandrum)", "AYJ (Ayodhya)"];
// const placeRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

// export default function RegisterFlight() {
//   const [form, setForm] = useState({
//     carrierName: "",
//     origin: "",
//     destination: "",
//     airFare: "",
//     arrivalTime:"",
//     departureTime:"",
//     seatsBusiness: "",
//     seatsEconomy: "",
//     seatsExecutive: ""
//   });

//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});
//   const [submitting, setSubmitting] = useState(false);
//   const [submitted, setSubmitted] = useState(false);
//   const navigate = useNavigate();

//   function setErr(k, msg) {
//     setErrors((e) => {
//       const ne = { ...e };
//       if (msg) ne[k] = msg;
//       else delete ne[k];
//       return ne;
//     });
//   }

//   function validateField(name) {
//     const v = (form[name] || "").toString().trim();
//     switch (name) {
//       case "carrierName":
//         if (!v) setErr(name, "Carrier is required");
//         else setErr(name, null);
//         break;
//       case "origin":
//       case "destination":
//         if (!v) setErr(name, "This field is required");
//         // else if (!placeRegex.test(v)) setErr(name, "Only letters and single spaces allowed");
//         else setErr(name, null);
//         break;
//       case "airFare": {
//         if (v === "") setErr(name, "AirFare is required");
//         else {
//           const n = Number(v);
//           if (Number.isNaN(n) || n < 2000 || n > 150000) setErr(name, "Enter fare between 2000 and 150000");
//           else setErr(name, null);
//         }
//         break;
//       }
//       case "seatsBusiness":
//         validateIntRange(name, v, 10, 30);
//         break;
//       case "seatsEconomy":
//         validateIntRange(name, v, 50, 70);
//         break;
//       case "seatsExecutive":
//         validateIntRange(name, v, 3, 8);
//         break;
//       default:
//         break;
//     }
//   }

//   function validateIntRange(name, v, min, max) {
//     if (v === "") {
//       setErr(name, "This field is required");
//       return;
//     }
//     const n = Number(v);
//     if (!Number.isInteger(n) || n < min || n > max) setErr(name, `Enter integer between ${min} and ${max}`);
//     else setErr(name, null);
//   }

//   function handleChange(e) {
//     const { name, value } = e.target;
//     setForm((f) => ({ ...f, [name]: value }));
//     if (touched[name]) validateField(name);
//   }

//   function handleBlur(e) {
//     const { name } = e.target;
//     setTouched((t) => ({ ...t, [name]: true }));
//     validateField(name);
//   }

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setSubmitted(true);
//     Object.keys(form).forEach((k) => validateField(k));
//     await new Promise((r) => setTimeout(r, 10));
//     if (Object.keys(errors).length > 0) return;

//     setSubmitting(true);
//     try {
//       const payload = {
//         carrierName: form.carrierName,
//         origin: form.origin,
//         destination: form.destination,
//         airFare: Number(form.airFare),
//         seats: {
//           business: Number(form.seatsBusiness),
//           economy: Number(form.seatsEconomy),
//           executive: Number(form.seatsExecutive)
//         }
//       };

//       const res = await fetch("http://localhost:4000/api/flights/add", {
//         method: "POST",
//         headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
//         body: JSON.stringify(payload)
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);
//       const id = data.flightId || data.id || data.flightNumber;
//       if (id) alert(`Flight registered successfully. Flight ID: ${id}`);
//       else alert("Flight registered successfully.");

//       setForm({ carrierName: "", origin: "", destination: "", airFare: "", seatsBusiness: "", seatsEconomy: "", seatsExecutive: "" });
//       setTouched({});
//       setErrors({});
//       setSubmitted(false);
//     } catch (err) {
//       alert("Failed to register flight: " + err.message);
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f3f7fb" }}>
//       <AdminNavBar />
//       <div style={{ width: "100%", maxWidth: 980, margin: "28px auto", background: "#fff", padding: 22, borderRadius: 12, boxShadow: "0 10px 30px rgba(9,30,66,0.06)" }}>
//         <h2>Register Flight</h2>
//         <p className="required-note">Fields marked <span className="req">*</span> are required</p>

//         <form onSubmit={handleSubmit}>
//           <div className="grid">
//             <div className="col">
//               <label className="required">Carrier Name</label>
//               <select name="carrierName" value={form.carrierName} onChange={handleChange} onBlur={handleBlur}>
//                 <option value="">Select carrier</option>
//                 {carrierOptions.map((c) => <option key={c} value={c}>{c}</option>)}
//               </select>
//               {errors.carrierName && (touched.carrierName || submitted) && <div className="error">{errors.carrierName}</div>}
//             </div>

//             <div className="col">
//               <label className="required">From</label>

//               {/* <input name="origin" value={form.origin} onChange={handleChange} onBlur={handleBlur} placeholder="City/Airport" /> */}

//               <select name="origin" value={form.origin} onChange={handleChange} onBlur={handleBlur}>
//                 <option value="">Select Origin</option>
//                 {airports.map((c) => <option key={c} value={c}>{c}</option>)}
//               </select>

//               {errors.origin && (touched.origin || submitted) && <div className="error">{errors.origin}</div>}
//             </div>

//             <div className="col">
//               <label className="required">To</label>
//               {/* <input name="destination" value={form.destination} onChange={handleChange} onBlur={handleBlur} placeholder="City/Airport" /> */}

//               <select name="destination" value={form.destination} onChange={handleChange} onBlur={handleBlur}>
//               <option value="">Select Destiantion</option>
//               {airports.map((c) => <option key={c} value={c}>{c}</option>)}
//               </select>

//               {errors.destination && (touched.destination || submitted) && <div className="error">{errors.destination}</div>}
//             </div>

//             <div className="col">
//               <label className="required">Air Fare (INR)</label>
//               <input name="airFare" value={form.airFare} onChange={handleChange} onBlur={handleBlur} type="number" min="2000" max="150000" placeholder="2000 - 150000" />
//               {errors.airFare && (touched.airFare || submitted) && <div className="error">{errors.airFare}</div>}
//             </div>

//             <div className="col">
//               <label className="required">Departure Time (24 Hrs)</label>
//                <input name="departureTime" value={form.departureTime} onChange={handleChange} type="datetime-local" placeholder="Departure Time"></input>

//             </div>
//             <div className="col">
//               <label className="required">Arrival Time (24 Hrs)</label>
//               <input name="arrivalTime" value={form.arrivalTime} onChange={handleChange} type="datetime-local" placeholder="Arrival Time"></input>
//             </div>

//             <div className="col">
//               <label className="required">Seat Capacity - Business Class</label>
//               <input name="seatsBusiness" value={form.seatsBusiness} onChange={handleChange} onBlur={handleBlur} type="number" min="10" max="30" placeholder="10 - 30" />
//               {errors.seatsBusiness && (touched.seatsBusiness || submitted) && <div className="error">{errors.seatsBusiness}</div>}
//             </div>

//             <div className="col">
//               <label className="required">Seat Capacity - Economy Class</label>
//               <input name="seatsEconomy" value={form.seatsEconomy} onChange={handleChange} onBlur={handleBlur} type="number" min="50" max="70" placeholder="50 - 70" />
//               {errors.seatsEconomy && (touched.seatsEconomy || submitted) && <div className="error">{errors.seatsEconomy}</div>}
//             </div>

//             <div className="col">
//               <label className="required">Seat Capacity - Executive Class</label>
//               <input name="seatsExecutive" value={form.seatsExecutive} onChange={handleChange} onBlur={handleBlur} type="number" min="3" max="8" placeholder="3 - 8" />
//               {errors.seatsExecutive && (touched.seatsExecutive || submitted) && <div className="error">{errors.seatsExecutive}</div>}
//             </div>
//           </div>

//           <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
//             <button className="primary" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Register Flight"}</button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavBar from "../adminNavBar/adminNavBar.jsx";
import "./registerFlight.css";

const carrierOptions = [
  "IndiGo",
  "Air India",
  "SpiceJet",
  "Vistara",
  "Air India Express",
  "Akasa Air",
  "Alliance Air",
];
const airports = [
  "DEL (Delhi)",
  "BOM (Mumbai)",
  "VNS (Varanasi)",
  "LKO (Lucknow)",
  "TRV (Trivandrum)",
  "AYJ (Ayodhya)",
];

export default function RegisterFlight() {
  const [form, setForm] = useState({
    carrierName: "",
    origin: "",
    destination: "",
    airFare: "",
    arrivalTime: "",
    departureTime: "",
    seatsBusiness: "",
    seatsEconomy: "",
    seatsExecutive: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  function setErr(k, msg) {
    setErrors((e) => {
      const ne = { ...e };
      if (msg) ne[k] = msg;
      else delete ne[k];
      return ne;
    });
  }

  // Helper: parse to Date safely
  function toDate(v) {
    return v ? new Date(v) : null;
  }

  function validateField(name) {
    const v = (form[name] || "").toString().trim();
    const now = new Date();

    switch (name) {
      case "carrierName":
        if (!v) setErr(name, "Carrier is required");
        else setErr(name, null);
        break;

      case "origin":
        if (!v) setErr(name, "This field is required");
        else if (v === form.destination)
          setErr(name, "Origin and Destination cannot be the same");
        else setErr(name, null);

        // validate destination again because it depends on origin
        // validateField("destination");
        break;

      case "destination":
        if (!v) setErr(name, "This field is required");
        else if (v === form.origin)
          setErr(name, "Origin and Destination cannot be the same");
        else setErr(name, null);

        // validate origin again because it depends on destination
        // validateField("origin");
        break;

      case "airFare": {
        if (v === "") setErr(name, "AirFare is required");
        else {
          const n = Number(v);
          if (Number.isNaN(n) || n < 2000 || n > 150000)
            setErr(name, "Enter fare between 2000 and 150000");
          else setErr(name, null);
        }
        break;
      }

      case "seatsBusiness":
        validateIntRange(name, v, 10, 30);
        break;
      case "seatsEconomy":
        validateIntRange(name, v, 50, 70);
        break;
      case "seatsExecutive":
        validateIntRange(name, v, 3, 8);
        break;

      case "departureTime": {
        if (!v) {
          setErr(name, "Departure time is required");
          break;
        }
        const dep = toDate(v);
        if (dep < now) {
          setErr(name, "Departure cannot be before current date/time");
        } else setErr(name, null);

        // Validate arrival again because it depends on departure
        // validateField("arrivalTime");
        break;
      }

      case "arrivalTime": {
        if (!v) {
          setErr(name, "Arrival time is required");
          break;
        }

        const arr = toDate(v);
        const dep = toDate(form.departureTime);

        if (!dep) {
          setErr(name, "Select departure time first");
          break;
        }

        const diffMin = (arr - dep) / (1000 * 60);

        if (diffMin < 30) {
          setErr(name, "Arrival must be at least 30 minutes after departure");
        } else if (diffMin > 2880) {
          setErr(name, "Arrival cannot be more than 2 days after departure");
        } else {
          setErr(name, null);
        }
        break;
      }

      default:
        break;
    }
  }

  function validateIntRange(name, v, min, max) {
    if (v === "") {
      setErr(name, "This field is required");
      return;
    }
    const n = Number(v);
    if (!Number.isInteger(n) || n < min || n > max)
      setErr(name, `Enter integer between ${min} and ${max}`);
    else setErr(name, null);
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

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);

    Object.keys(form).forEach((k) => validateField(k));

    await new Promise((r) => setTimeout(r, 50));

    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);

    try {
      const payload = {
        carrierName: form.carrierName,
        source: form.origin,
        destination: form.destination,
        price: Number(form.airFare),
        arrivalTime: form.arrivalTime,
        departureTime: form.departureTime,
        seats: {
          economy: Number(form.seatsEconomy),
          business: Number(form.seatsBusiness),
          executive: Number(form.seatsExecutive),
        },
      };

      const res = await fetch("http://localhost:4000/api/flights/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(`Flight registered successfully. Flight ID: ${data.data.flightNumber}`);

      setForm({
        carrierName: "",
        origin: "",
        destination: "",
        airFare: "",
        arrivalTime: "",
        departureTime: "",
        seatsBusiness: "",
        seatsEconomy: "",
        seatsExecutive: "",
      });
      setErrors({});
      setTouched({});
      setSubmitted(false);
    } catch (err) {
      alert("Failed to register flight: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f3f7fb",
      }}
    >
      <AdminNavBar />

      <div
        style={{
          width: "100%",
          maxWidth: 980,
          margin: "28px auto",
          background: "#fff",
          padding: 22,
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(9,30,66,0.06)",
        }}
      >
        <h2>Register Flight</h2>
        <p className="required-note">
          Fields marked <span className="req">*</span> are required
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid">
            {/* Carrier */}
            <div className="col">
              <label className="required">Carrier Name</label>
              <select
                name="carrierName"
                value={form.carrierName}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="">Select carrier</option>
                {carrierOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.carrierName && (touched.carrierName || submitted) && (
                <div className="error">{errors.carrierName}</div>
              )}
            </div>

            {/* Origin */}
            <div className="col">
              <label className="required">From</label>
              <select
                name="origin"
                value={form.origin}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="">Select Origin</option>
                {airports.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.origin && (touched.origin || submitted) && (
                <div className="error">{errors.origin}</div>
              )}
            </div>

            {/* Destination */}
            <div className="col">
              <label className="required">To</label>
              <select
                name="destination"
                value={form.destination}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="">Select Destination</option>
                {airports.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.destination && (touched.destination || submitted) && (
                <div className="error">{errors.destination}</div>
              )}
            </div>

            {/* Fare */}
            <div className="col">
              <label className="required">Air Fare (INR)</label>
              <input
                name="airFare"
                value={form.airFare}
                onChange={handleChange}
                onBlur={handleBlur}
                type="number"
                min="2000"
                max="150000"
                placeholder="2000 - 150000"
              />
              {errors.airFare && (touched.airFare || submitted) && (
                <div className="error">{errors.airFare}</div>
              )}
            </div>

            {/* Departure */}
            <div className="col">
              <label className="required">Departure Time</label>
              <input
                name="departureTime"
                value={form.departureTime}
                onChange={handleChange}
                onBlur={handleBlur}
                type="datetime-local"
              />
              {errors.departureTime && (touched.departureTime || submitted) && (
                <div className="error">{errors.departureTime}</div>
              )}
            </div>

            {/* Arrival */}
            <div className="col">
              <label className="required">Arrival Time</label>
              <input
                name="arrivalTime"
                value={form.arrivalTime}
                onChange={handleChange}
                onBlur={handleBlur}
                type="datetime-local"
              />
              {errors.arrivalTime && (touched.arrivalTime || submitted) && (
                <div className="error">{errors.arrivalTime}</div>
              )}
            </div>

            {/* Business */}
            <div className="col">
              <label className="required">Seat Capacity - Business</label>
              <input
                name="seatsBusiness"
                value={form.seatsBusiness}
                onChange={handleChange}
                onBlur={handleBlur}
                type="number"
                min="10"
                max="30"
                placeholder="10 - 30"
              />
              {errors.seatsBusiness && (touched.seatsBusiness || submitted) && (
                <div className="error">{errors.seatsBusiness}</div>
              )}
            </div>

            {/* Economy */}
            <div className="col">
              <label className="required">Seat Capacity - Economy</label>
              <input
                name="seatsEconomy"
                value={form.seatsEconomy}
                onChange={handleChange}
                onBlur={handleBlur}
                type="number"
                min="50"
                max="70"
                placeholder="50 - 70"
              />
              {errors.seatsEconomy && (touched.seatsEconomy || submitted) && (
                <div className="error">{errors.seatsEconomy}</div>
              )}
            </div>

            {/* Executive */}
            <div className="col">
              <label className="required">Seat Capacity - Executive</label>
              <input
                name="seatsExecutive"
                value={form.seatsExecutive}
                onChange={handleChange}
                onBlur={handleBlur}
                type="number"
                min="3"
                max="8"
                placeholder="3 - 8"
              />
              {errors.seatsExecutive &&
                (touched.seatsExecutive || submitted) && (
                  <div className="error">{errors.seatsExecutive}</div>
                )}
            </div>
          </div>

          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 18 }}
          >
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Register Flight"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
