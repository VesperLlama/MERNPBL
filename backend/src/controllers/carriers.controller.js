// /**
//  * carriers.controller.js
//  * Admin-only carrier management: register, update, list
//  */

// const { readJson, atomicUpdate, getNextId } = require('../utils/jsonDb');
// const { validateCarrier } = require('../utils/validators');

// const CARRIERS_FILE = 'carriers.json';

// exports.registerCarrier = async (req, res, next) => {
//   try {
//     const payload = req.body || {};
//     // validate payload (optional fields allowed)
//     const { error } = validateCarrier(payload);
//     if (error) {
//       const messages = error.details.map(d => d.message);
//       return res.status(400).json({ message: 'Validation failed', errors: messages });
//     }

//     // atomic insert
//     await atomicUpdate(CARRIERS_FILE, async (carriers) => {
//       if (!Array.isArray(carriers)) carriers = [];

//       // avoid duplicate carrier name
//       const exists = carriers.find(c => c.CarrierName && c.CarrierName.toLowerCase() === payload.CarrierName.toLowerCase());
//       if (exists) {
//         const err = new Error('Carrier with this name already exists');
//         err.status = 400;
//         throw err;
//       }

//       const id = await getNextId('carrierId');

//       const record = {
//         CarrierId: id,
//         CarrierName: payload.CarrierName,
//         Discounts: payload.Discounts || {
//           days30: 0, days60: 0, days90: 0,
//           bulkBookingPercent: 0,
//           tierDiscounts: { Silver: 0, Gold: 0, Platinum: 0 }
//         },
//         Refunds: payload.Refunds || { days2: 0, days10: 0, days20plus: 0 },
//         CreatedAt: new Date().toISOString()
//       };

//       carriers.push(record);
//       return carriers;
//     });

//     // read meta for id
//     const carriersNow = readJson(CARRIERS_FILE);
//     const created = carriersNow[carriersNow.length - 1];
//     return res.status(201).json({ message: 'Carrier registered', CarrierId: created.CarrierId });
//   } catch (err) {
//     if (err.status === 400) return res.status(400).json({ message: err.message });
//     next(err);
//   }
// };

// exports.updateCarrier = async (req, res, next) => {
//   try {
//     const id = Number(req.params.id);
//     const payload = req.body || {};

//     // validate payload (we accept partial updates; validate only if keys present)
//     const { error } = validateCarrier({ ...payload, CarrierName: payload.CarrierName || 'x' });
//     if (error) {
//       // allow if only partial and carrierName missing; filter messages sensibly
//       const msgs = error.details.map(d => d.message);
//       // If CarrierName missing, ignore that error
//       const filtered = msgs.filter(m => !m.includes('CarrierName'));
//       if (filtered.length > 0) return res.status(400).json({ message: 'Validation failed', errors: filtered });
//     }

//     // atomic update
//     let updatedCarrier = null;
//     await atomicUpdate(CARRIERS_FILE, async (carriers) => {
//       if (!Array.isArray(carriers)) carriers = [];
//       const idx = carriers.findIndex(c => Number(c.CarrierId) === id);
//       if (idx === -1) {
//         const err = new Error('Carrier not found');
//         err.status = 404;
//         throw err;
//       }

//       // merge fields (safe merge)
//       const existing = carriers[idx];
//       const merged = {
//         ...existing,
//         CarrierName: payload.CarrierName || existing.CarrierName,
//         Discounts: payload.Discounts ? { ...existing.Discounts, ...payload.Discounts } : existing.Discounts,
//         Refunds: payload.Refunds ? { ...existing.Refunds, ...payload.Refunds } : existing.Refunds,
//         UpdatedAt: new Date().toISOString()
//       };
//       carriers[idx] = merged;
//       updatedCarrier = merged;
//       return carriers;
//     });

//     return res.json({ message: 'Carrier updated', carrier: updatedCarrier });
//   } catch (err) {
//     if (err.status === 400) return res.status(400).json({ message: err.message });
//     if (err.status === 404) return res.status(404).json({ message: err.message });
//     next(err);
//   }
// };

// exports.listCarriers = (req, res, next) => {
//   try {
//     const q = (req.query.q || '').toLowerCase();
//     const carriers = readJson(CARRIERS_FILE) || [];
//     const filtered = q ? carriers.filter(c => (c.CarrierName || '').toLowerCase().includes(q)) : carriers;
//     return res.json({ data: filtered });
//   } catch (err) {
//     next(err);
//   }
// };


/**
 * carriers.controller.js
 * Admin-only carrier management: register, update, list
 *
 * Simple JSON read/write (no atomicUpdate / locks)
 */

const { readJson, writeJson, getNextId } = require('../utils/jsonDb');
const { validateCarrier } = require('../utils/validators');

const CARRIERS_FILE = 'carriers.json';

exports.registerCarrier = async (req, res, next) => {
  try {
    const payload = req.body || {};

    // validate payload (optional fields allowed)
    // const { error } = validateCarrier(payload);
    // if (error) {
    //   const messages = error.details.map(d => d.message);
    //   return res.status(400).json({ message: 'Validation failed', errors: messages });
    // }

    // Read existing carriers
    let carriers = readJson(CARRIERS_FILE);
    if (!Array.isArray(carriers)) carriers = [];

    // avoid duplicate carrier name (case-insensitive)
    const exists = carriers.find(
      c => c.CarrierName && c.CarrierName.toLowerCase() === (payload.carrierName || '').toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ message: 'Carrier already exists' });
    }

    // Get next id (simple, non-atomic)
    const id = getNextId('carrierId');

    const record = {
      CarrierId: id,
      CarrierName: payload.carrierName,
      Discounts: payload.discounts || {
        days30: 0, days60: 0, days90: 0,
        bulkBookingPercent: 0,
      },
      userDiscounts: payload.userDiscounts,
      Refunds: payload.refunds || { days2: 0, days10: 0, days20plus: 0 },
      CreatedAt: new Date().toISOString()
    };

    carriers.push(record);
    writeJson(CARRIERS_FILE, carriers);

    return res.status(201).json({ message: 'Carrier registered', carrierId: record.CarrierId });
  } catch (err) {
    next(err);
  }
};

exports.updateCarrier = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body || {};

    // validate payload (we accept partial updates; validate only if keys present)
    const { error } = validateCarrier({ ...payload, CarrierName: payload.CarrierName || 'x' });
    if (error) {
      const msgs = error.details.map(d => d.message);
      // If CarrierName missing, ignore that error (we used 'x' placeholder above)
      const filtered = msgs.filter(m => !m.includes('CarrierName'));
      if (filtered.length > 0) return res.status(400).json({ message: 'Validation failed', errors: filtered });
    }

    // Read carriers
    let carriers = readJson(CARRIERS_FILE);
    if (!Array.isArray(carriers)) carriers = [];

    const idx = carriers.findIndex(c => Number(c.CarrierId) === id);
    if (idx === -1) {
      return res.status(404).json({ message: 'Carrier not found' });
    }

    const existing = carriers[idx];

    // merge fields (safe merge)
    const merged = {
      ...existing,
      CarrierName: payload.CarrierName || existing.CarrierName,
      Discounts: payload.Discounts ? { ...existing.Discounts, ...payload.Discounts } : existing.Discounts,
      Refunds: payload.Refunds ? { ...existing.Refunds, ...payload.Refunds } : existing.Refunds,
      UpdatedAt: new Date().toISOString()
    };

    carriers[idx] = merged;
    writeJson(CARRIERS_FILE, carriers);

    return res.json({ message: 'Carrier updated', carrier: merged });
  } catch (err) {
    next(err);
  }
};

exports.listCarriers = (req, res, next) => {
  try {
    const q = (req.query.q || '').toLowerCase();
    const carriers = readJson(CARRIERS_FILE) || [];
    const filtered = q
      ? carriers.filter(c => (c.CarrierName || '').toLowerCase().includes(q))
      : carriers;
    return res.json({ data: filtered });
  } catch (err) {
    next(err);
  }
};

exports.getCarrierById = (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid CarrierId" });
    }

    const carriers = readJson(CARRIERS_FILE) || [];
    const carrier = carriers.find(c => Number(c.CarrierId) === id);

    if (!carrier) {
      return res.status(404).json({ message: "Carrier not found" });
    }

    return res.json({ data: carrier });
  } catch (err) {
    next(err);
  }
};