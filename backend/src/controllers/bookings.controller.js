const { readJson, writeJson, getNextId } = require('../utils/jsonDb');
const Booking = require('../../models/bookings.model');
const { TotalPrice } = require('../utils/TotalPriceCalculation');

const BOOKINGS_FILE = 'bookings.json';
const FLIGHTS_FILE = 'flights.json';
const CUSTOMERS_FILE = 'customers.json';

// PNR generator: 6-char alphanumeric uppercase
function generatePNR() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pnr = '';
  for (let i = 0; i < 6; i++) {
    pnr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pnr;
}

// ------------------ Customer: Book a flight ------------------
// exports.bookFlight = async (req, res, next) => {
//   try {
//     // req.user set by requireAuth('customer')
//     const customerId = req.user?.id;
//     if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

//     const { flightNumber, type, noOfPassenger } = req.body || {};
//     if (!flightNumber) return res.status(400).json({ message: 'flightNumber is required' });

//     // read flight
//     const flights = readJson(FLIGHTS_FILE) || [];
//     const flight = flights.find(f => f.flightNumber === flightNumber);

//     if (!flight) return res.status(404).json({ message: 'Flight not found' });
//     // check flight status
//     if (flight.FlightStatus && flight.FlightStatus.toLowerCase() === 'cancelled') {
//       return res.status(400).json({ message: 'Cannot book a cancelled flight' });
//     }

//     // check seats (we assume fields TotalSeats, BookedSeats exist)
//     const totalSeats = Number(flight.TotalSeats) || 0;
//     const bookedSeats = Number(flight.BookedSeats) || 0;
//     const totalEconomySeats = Number(flight.seats.economy) || 0;
//     const totalBusinessSeats = Number(flight.seats.business) || 0;
//     const totalExecutiveSeats = Number(flight.seats.executive) || 0;
//     const bookedEconomySeats = Number(flight.BookedSeats.economy) || 0;
//     const bookedBusinessSeats = Number(flight.BookedSeats.business) || 0;
//     const bookedExecutiveSeats = Number(flight.BookedSeats.executive) || 0;

//     noOfPassenger = Number(bookings.noOfPassenger);

//     let basePrice = Number(flight.price) || 0;
//     let available = 0;
//     if (type === "economy") {
//       available = totalEconomySeats - bookedEconomySeats;
//     }
//     else if (type === "business") {
//       available = totalBusinessSeats - bookedBusinessSeats;
//       basePrice = basePrice * 1.5;
//     }
//     else if (type === "executive") {
//       available = totalExecutiveSeats - bookedExecutiveSeats;
//       basePrice = basePrice * 2.25;
//     }
//     if (available <= 0) return res.status(400).json({ message: 'No seats available' });

//     // read bookings and customers
//     const bookings = readJson(BOOKINGS_FILE) || [];
//     const customers = readJson(CUSTOMERS_FILE) || [];
//     const customer = customers.find(c => Number(c.CustomerId) === Number(customerId));
//     if (!customer) return res.status(404).json({ message: 'Customer not found' });

//     // generate unique PNR
//     let pnr;
//     do {
//       pnr = generatePNR();
//     } while (bookings.some(b => b.PNR === pnr));

//     // create booking id
//     const bookingId = getNextId('bookingId');

//     // ----------------------------
//     // DISCOUNT: days30 / 60 / 90
//     // ----------------------------
//     // find carrier to read its Discounts
//     const carriers = readJson(CARRIERS_FILE) || [];
//     const carrier = carriers.find(c => c.CarrierName && c.CarrierName.toLowerCase() === (flight.carrierName || flight.CarrierName || '').toLowerCase());

//     // default discount
//     // let discountPercent = 0;

//     // if (carrier && carrier.Discounts) {
//     //   // parse flight.departureTime -> Date (assume format "YYYY-MM-DD HH:mm" or similar)
//     //   const depRaw = flight.departureTime;
//     //   // normalize and parse using Date constructor (tolerant)
//     //   const depDate = new Date(depRaw.replace(' ', 'T'));
//     //   if (!isNaN(depDate.getTime())) {
//     //     // booking date = now (current date)
//     //     const now = new Date();
//     //     // compute difference using UTC day arithmetic (ignore partial day fractions)
//     //     const msPerDay = 24 * 60 * 60 * 1000;
//     //     const depStart = new Date(Date.UTC(depDate.getUTCFullYear(), depDate.getUTCMonth(), depDate.getUTCDate()));
//     //     const nowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
//     //     const daysDiff = Math.floor((depStart - nowStart) / msPerDay);

//     //     // choose largest applicable discount
//     //     const d = carrier.Discounts || {};
//     //     const days90 = Number(d.days90 || 0);
//     //     const days60 = Number(d.days60 || 0);
//     //     const days30 = Number(d.days30 || 0);

//     //     if (daysDiff >= 90 && days90 > 0) discountPercent = days90;
//     //     else if (daysDiff >= 60 && days60 > 0) discountPercent = days60;
//     //     else if (daysDiff >= 30 && days30 > 0) discountPercent = days30;
//     //     // else discountPercent stays 0
//     //   }
//     // }

//     // // apply discount to basePrice
//     // const discounted = Math.round((basePrice * (1 - discountPercent / 100)) * 100) / 100; // 2 decimals
//     // const pricePaid = discounted;

//     // default discount
// let discountPercent = 0;

// if (carrier && carrier.Discounts) {
//   // parse flight.departureTime -> Date
//   const depRaw = flight.departureTime;
//   const depDate = new Date(depRaw.replace(' ', 'T'));

//   if (!isNaN(depDate.getTime())) {
//     const now = new Date();

//     // compute difference in full days
//     const msPerDay = 24 * 60 * 60 * 1000;
//     const depStart = new Date(Date.UTC(depDate.getUTCFullYear(), depDate.getUTCMonth(), depDate.getUTCDate()));
//     const nowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
//     const daysDiff = Math.floor((depStart - nowStart) / msPerDay);

//     // NEW KEYS matching your carriers.json
//     const d = carrier.Discounts || {};

//     const days90 = Number(d["90DaysAdvanceBooking"] || 0);
//     const days60 = Number(d["60DaysAdvanceBooking"] || 0);
//     const days30 = Number(d["30DaysAdvanceBooking"] || 0);

//     // apply largest applicable discount
//     if (daysDiff >= 90 && days90 > 0) discountPercent = days90;
//     else if (daysDiff >= 60 && days60 > 0) discountPercent = days60;
//     else if (daysDiff >= 30 && days30 > 0) discountPercent = days30;
//   }
// }

// // apply discount to basePrice
// const discounted = Math.round((basePrice * (1 - discountPercent / 100)) * 100) / 100;
// const pricePaid = discounted;

//     // const pricePaid = (typeof price === 'number' && price > 0) ? price : (flight.price || 0);

//     const newBooking = new Booking(
//       bookingId,
//       customerId,
//       flightNumber,
//       pnr,
//       'Booked',
//       new Date().toISOString(),
//       pricePaid,
//       null,
//       null,
//       type
//     );

//     // push booking and update flight BookedSeats
//     bookings.push(newBooking);
//     writeJson(BOOKINGS_FILE, bookings);

//     // update flight bookedSeats
//     if (type === "economy") {
//       flight.BookedSeats.economy = (Number(bookedEconomySeats) || 0) + 1;
//     }
//     else if (type === "business") {
//       flight.BookedSeats.business = (Number(bookedBusinessSeats) || 0) + 1;
//     }
//     else if (type === "executive") {
//       flight.BookedSeats.executive = (Number(bookedExecutiveSeats) || 0) + 1;
//     }
//     // persist flights
//     writeJson(FLIGHTS_FILE, flights);

//     return res.status(201).json({ message: 'Booked', booking: newBooking });
//   } catch (err) {
//     next(err);
//   }
// };

exports.bookFlight = async (req, res, next) => {
  try {
    // req.user set by requireAuth('customer')
    const customerId = req.user?.id;
    if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

    const { flightNumber, type, quantity } = req.body || {};
    const qty = Math.max(1, Number(quantity) || 1); // default 1, at least 1
    

    if (!flightNumber) return res.status(400).json({ message: 'flightNumber is required' });
    if (quantity <= 0 || quantity >15 ) return res.status(400).json({ message: 'quantity must be >1 & <15' });



    // read flight
    const flights = readJson(FLIGHTS_FILE) || [];
    const flight = flights.find(f => f.flightNumber === flightNumber);

    if (!flight) return res.status(404).json({ message: 'Flight not found' });

    // check flight status
    if (flight.FlightStatus && flight.FlightStatus.toLowerCase() === 'cancelled') {
      return res.status(400).json({ message: 'Cannot book a cancelled flight' });
    }

    // // check seats (we assume fields TotalSeats, BookedSeats exist)
    // const totalSeats = Number(flight.TotalSeats) || 0;
    // const bookedSeats = Number(flight.BookedSeats) || 0;
    // const totalEconomySeats = Number(flight.seats.economy) || 0;
    // const totalBusinessSeats = Number(flight.seats.business) || 0;
    // const totalExecutiveSeats = Number(flight.seats.executive) || 0;
    // const bookedEconomySeats = Number(flight.BookedSeats.economy) || 0;
    // const bookedBusinessSeats = Number(flight.BookedSeats.business) || 0;
    // const bookedExecutiveSeats = Number(flight.BookedSeats.executive) || 0;

    // normalize seats & bookedSeats structure (ensure per-class counters exist)
    if (!flight.seats) flight.seats = { economy: 0, business: 0, executive: 0 };
    if (typeof flight.BookedSeats === 'number') {
      const num = Number(flight.BookedSeats) || 0;
      flight.BookedSeats = { economy: num, business: 0, executive: 0 };
    } else {
      flight.BookedSeats = flight.BookedSeats || { economy: 0, business: 0, executive: 0 };
      flight.BookedSeats.economy = Number(flight.BookedSeats.economy || 0);
      flight.BookedSeats.business = Number(flight.BookedSeats.business || 0);
      flight.BookedSeats.executive = Number(flight.BookedSeats.executive || 0);
    }

    const totalEconomySeats = Number(flight.seats.economy) || 0;
    const totalBusinessSeats = Number(flight.seats.business) || 0;
    const totalExecutiveSeats = Number(flight.seats.executive) || 0;
    const bookedEconomySeats = Number(flight.BookedSeats.economy) || 0;
    const bookedBusinessSeats = Number(flight.BookedSeats.business) || 0;
    const bookedExecutiveSeats = Number(flight.BookedSeats.executive) || 0;

    // noOfPassenger = Number(bookings.noOfPassenger);

    let basePrice = Number(flight.price) || 0;
    let available = 0;
    if (type === "economy") {
      available = totalEconomySeats - bookedEconomySeats - quantity;
    }
    else if (type === "business") {
      available = totalBusinessSeats - bookedBusinessSeats - quantity;
      basePrice = basePrice * 1.5;
    }
    else if (type === "executive") {
      available = totalExecutiveSeats - bookedExecutiveSeats - quantity;
      basePrice = basePrice * 2.25;
    }
    if (available <= 0) return res.status(400).json({ message: 'No seats available' });

    // read bookings and customers
    const bookings = readJson(BOOKINGS_FILE) || [];
    const customers = readJson(CUSTOMERS_FILE) || [];
    const customer = customers.find(c => Number(c.CustomerId) === Number(customerId));
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    // generate unique PNR
    let pnr;
    do {
      pnr = generatePNR();
    } while (bookings.some(b => b.PNR === pnr));

    // create booking id
    const bookingId = getNextId('bookingId');

    const priceData = TotalPrice(customer.CustomerCategory, (quantity > 10), flight, type, qty);

    // ----------------------------
    // DISCOUNT: days30 / 60 / 90
    // ----------------------------
    // find carrier to read its Discounts
    // const carriers = readJson(CARRIERS_FILE) || [];
    // const carrier = carriers.find(c => c.CarrierName && c.CarrierName.toLowerCase() === (flight.carrierName || flight.CarrierName || '').toLowerCase());

    // let advancePercent = 0;
    // let bulkPercent = 0;

    // if (carrier && carrier.Discounts) {
    //   const d = carrier.Discounts;

    //   // parse departure date
    //   const depDate = new Date(String(flight.departureTime).replace(' ', 'T'));
    //   if (!isNaN(depDate.getTime())) {
    //     const now = new Date();
    //     const msPerDay = 24 * 60 * 60 * 1000;
    //     const depStart = new Date(Date.UTC(depDate.getUTCFullYear(), depDate.getUTCMonth(), depDate.getUTCDate()));
    //     const nowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    //     const daysDiff = Math.floor((depStart - nowStart) / msPerDay);

    //     const days90 = Number(d['90DaysAdvanceBooking'] || 0);
    //     const days60 = Number(d['60DaysAdvanceBooking'] || 0);
    //     const days30 = Number(d['30DaysAdvanceBooking'] || 0);

    //     if (daysDiff >= 90 && days90 > 0) advancePercent = days90;
    //     else if (daysDiff >= 60 && days60 > 0) advancePercent = days60;
    //     else if (daysDiff >= 30 && days30 > 0) advancePercent = days30;
    //   }

    //   // bulk booking percent
    //   bulkPercent = Number(d['BulkBooking'] || 0);
    // }

    // // determine per-seat base price by class
    // let basePerSeat = Number(flight.price) || 0;

    // if (type === "business") basePerSeat = basePerSeat * 1.5;
    // else if (type === "executive") basePerSeat = basePerSeat * 2.25;
    // else if (!type) type = 'economy'; // default to economy

    // // Combine discounts (additive). If you want multiplicative, change logic.
    // const totalPercentPerSeat = advancePercent + bulkPercent;

    // // Calculate price per seat after combined discount
    // const perSeatAfterDiscount = Math.round((basePerSeat * (1 - totalPercentPerSeat / 100)) * 100) / 100;

    // // Total pricePaid = perSeatAfterDiscount * quantity
    // const pricePaid = Math.round(perSeatAfterDiscount * qty * 100) / 100;

    // create booking object (Option A: single booking with quantity)
    // Booking constructor in your project may accept an extra `type` and `quantity` param at the end.
    const newBooking = new Booking(
      bookingId,
      customerId,
      flightNumber,
      pnr,
      'Booked',
      new Date().toISOString(),
      priceData.finalPrice,
      null,
      null,
      type,
      qty // quantity (added as last param)
    );

    // push booking and update flight BookedSeats per class by qty
    bookings.push(newBooking);
    writeJson(BOOKINGS_FILE, bookings);

    if (type === "economy") {
      flight.BookedSeats.economy = (Number(bookedEconomySeats) || 0) + qty;
    } else if (type === "business") {
      flight.BookedSeats.business = (Number(bookedBusinessSeats) || 0) + qty;
    } else if (type === "executive") {
      flight.BookedSeats.executive = (Number(bookedExecutiveSeats) || 0) + qty;
    }

    // persist flights (save normalized BookedSeats too)
    writeJson(FLIGHTS_FILE, flights);

    return res.status(201).json({ message: 'Booked', booking: newBooking });
  } catch (err) {
    next(err);
  }
};




// ------------------ Customer: Cancel booking by PNR ------------------
// exports.cancelBookingByPNR = (req, res, next) => {
//   try {
//     const customerId = req.user?.id;
//     if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

//     const { pnr } = req.params;
//     if (!pnr) return res.status(400).json({ message: 'PNR required' });

//     const bookings = readJson(BOOKINGS_FILE) || [];
//     const index = bookings.findIndex(b => b.PNR === pnr);

//     if (index === -1) return res.status(404).json({ message: 'Booking not found' });

//     const booking = bookings[index];

//     // check owner
//     if (Number(booking.CustomerId) !== Number(customerId)) {
//       return res.status(403).json({ message: 'Forbidden: not your booking' });
//     }

//     if (booking.BookingStatus !== 'Booked') {
//       return res.status(400).json({ message: 'Booking is not in Booked state' });
//     }

//     // mark cancelled by customer
//     booking.BookingStatus = 'CancelledByCustomer';
//     booking.CancelledAt = new Date().toISOString();
//     // RefundAmount will be computed later by refund rules; leave null for now
//     booking.RefundAmount = null;

//     // update bookings
//     writeJson(BOOKINGS_FILE, bookings);

//     // free seat in flight
//     const flights = readJson(FLIGHTS_FILE) || [];
//     const flight = flights.find(f => f.flightNumber === booking.flightNumber);
//     if (flight) {
//       flight.BookedSeats = Math.max(0, (Number(flight.BookedSeats) || 0) - 1);
//       writeJson(FLIGHTS_FILE, flights);
//     }

//     return res.json({ message: 'Booking cancelled', booking });
//   } catch (err) {
//     next(err);
//   }
// };

// ------------------ Admin: Cancel entire flight by flightNumber (cancels all bookings for that flight) ------------------

exports.cancelBookingByPNR = (req, res, next) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

    const { pnr } = req.params;
    if (!pnr) return res.status(400).json({ message: 'PNR required' });

    const bookings = readJson(BOOKINGS_FILE) || [];
    const index = bookings.findIndex(b => b.PNR === pnr);

    if (index === -1) return res.status(404).json({ message: 'Booking not found' });

    const booking = bookings[index];

    // check owner
    if (Number(booking.CustomerId) !== Number(customerId)) {
      return res.status(403).json({ message: 'Forbidden: not your booking' });
    }

    if (booking.BookingStatus !== 'Booked') {
      return res.status(400).json({ message: 'Booking is not in Booked state' });
    }

    // mark cancelled by customer
    booking.BookingStatus = 'CancelledByCustomer';
    booking.CancelledAt = new Date().toISOString();
    // RefundAmount will be computed later by refund rules; leave null for now
    booking.RefundAmount = null;

    // update bookings
    writeJson(BOOKINGS_FILE, bookings);

    // free seat in flight
    const flights = readJson(FLIGHTS_FILE) || [];
    const flight = flights.find(f => f.flightNumber === booking.flightNumber);
    if (flight) {
      // normalize BookedSeats object if needed
      if (typeof flight.BookedSeats === 'number') {
        const n = Number(flight.BookedSeats) || 0;
        flight.BookedSeats = { economy: n, business: 0, executive: 0 };
      } else {
        flight.BookedSeats = flight.BookedSeats || { economy: 0, business: 0, executive: 0 };
      }

      const bType = booking.type || booking.seatType || 'economy';
      const qtyToFree = Number(booking.Quantity || booking.quantity || 1);

      if (bType === 'business') {
        flight.BookedSeats.business = Math.max(0, (Number(flight.BookedSeats.business) || 0) - qtyToFree);
      } else if (bType === 'executive') {
        flight.BookedSeats.executive = Math.max(0, (Number(flight.BookedSeats.executive) || 0) - qtyToFree);
      } else {
        flight.BookedSeats.economy = Math.max(0, (Number(flight.BookedSeats.economy) || 0) - qtyToFree);
      }

      // persist flights
      writeJson(FLIGHTS_FILE, flights);
    }

    return res.json({ message: 'Booking cancelled', booking });
  } catch (err) {
    next(err);
  }
};


exports.adminCancelFlight = (req, res, next) => {
  try {
    // requireAuth('admin') must be used on route
    const { flightNumber } = req.params;
    if (!flightNumber) return res.status(400).json({ message: 'flightNumber required' });

    const flights = readJson(FLIGHTS_FILE) || [];
    const flight = flights.find(f => f.flightNumber === flightNumber);
    if (!flight) return res.status(404).json({ message: 'Flight not found' });

    // mark flight cancelled
    flight.FlightStatus = 'Cancelled';
    writeJson(FLIGHTS_FILE, flights);

    // update bookings for this flight
    const bookings = readJson(BOOKINGS_FILE) || [];
    let changed = 0;
    bookings.forEach(b => {
      if (b.flightNumber === flightNumber && b.BookingStatus === 'Booked') {
        b.BookingStatus = 'CancelledByAdmin';
        b.CancelledAt = new Date().toISOString();
        b.RefundAmount = null; // to be calculated later
        changed++;
      }
    });
    writeJson(BOOKINGS_FILE, bookings);

    // reset booked seats to 0 for the flight (since all bookings cancelled)
    flight.BookedSeats = 0;
    writeJson(FLIGHTS_FILE, flights);

    return res.json({ message: 'Flight cancelled by admin', cancelledBookings: changed });
  } catch (err) {
    next(err);
  }
};

// ------------------ Admin: View all bookings ------------------
exports.listAllBookings = (req, res, next) => {
  try {
    const bookings = readJson(BOOKINGS_FILE) || [];
    return res.json({ data: bookings });
  } catch (err) {
    next(err);
  }
};

// ------------------ Customer: View my bookings ------------------
// exports.listMyBookings = (req, res, next) => {
//   try {
//     const customerId = req.user?.id;
//     if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

//     const bookings = readJson(BOOKINGS_FILE) || [];
//     const mine = bookings.filter(b => Number(b.CustomerId) === Number(customerId));
//     return res.json({ data: mine });
//   } catch (err) {
//     next(err);
//   }
// };

exports.listMyBookings = (req, res, next) => {
  try {
    const customerId = req.user?.id;
    if (!customerId)
      return res.status(401).json({ message: "Unauthorized" });

    const bookings = readJson(BOOKINGS_FILE) || [];
    const flights = readJson(FLIGHTS_FILE) || [];

    // Utility to normalize
    const norm = (x) => String(x || "").trim().toLowerCase();

    const result = bookings
      .filter((b) => Number(b.CustomerId) === Number(customerId))
      .map((b) => {
        const flight = flights.find(
          (f) => norm(f.flightNumber) === norm(b.flightNumber)
        );

        // Flattened merged object
        return {
          // booking fields
          BookingId: b.BookingId,
          CustomerId: b.CustomerId,
          PNR: b.PNR,
          BookingStatus: b.BookingStatus,
          BookedAt: b.BookedAt,
          PricePaid: b.PricePaid,
          CancelledAt: b.CancelledAt,
          RefundAmount: b.RefundAmount,
          type: b.type,
          Quantity: b.quantity,

          // flight fields (null-safe)
          flightNumber: flight?.flightNumber || null,
          from: flight?.source || null,
          to: flight?.destination || null,
          departure: flight?.departureTime || null,
          arrival: flight?.arrivalTime || null,
          amount: flight?.price ?? null,
          flightStatus: flight?.FlightStatus || null,
        };
      });

    return res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

exports.calculatePrice = (req, res, next) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) return res.status(401).json({ message: 'Unauthorized' });
    const { flightNumber, type, quantity } = req.body || {};
    const flights = readJson(FLIGHTS_FILE) || [];
    const flight = flights.find(f => f.flightNumber === flightNumber);
    const customers = readJson(CUSTOMERS_FILE) || [];
    const customer = customers.find(c => Number(c.CustomerId) === Number(customerId));

    const priceData = TotalPrice(customer.CustomerCategory, (quantity > 10), flight, type, quantity);
    return res.json({data : priceData});
  } catch (err) {
    next(err);
  }
}