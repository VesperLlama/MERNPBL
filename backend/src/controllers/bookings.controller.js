const { readJson, writeJson, getNextId } = require('../utils/jsonDb');
const Booking = require('../../models/bookings.model');
const PDFDocument = require('pdfkit');
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


exports.bookFlight = async (req, res, next) => {
  try {
    // req.user set by requireAuth('customer')
    const customerId = req.user?.id;
    if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

    const { flightNumber, type, quantity, passengers } = req.body || {};
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
      qty,
      passengers
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

// ------------------ Customer: Cancel flight) ------------------

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
//       // normalize BookedSeats object if needed
//       if (typeof flight.BookedSeats === 'number') {
//         const n = Number(flight.BookedSeats) || 0;
//         flight.BookedSeats = { economy: n, business: 0, executive: 0 };
//       } else {
//         flight.BookedSeats = flight.BookedSeats || { economy: 0, business: 0, executive: 0 };
//       }

//       const bType = booking.type || booking.seatType || 'economy';
//       const qtyToFree = Number(booking.Quantity || booking.quantity || 1);

//       if (bType === 'business') {
//         flight.BookedSeats.business = Math.max(0, (Number(flight.BookedSeats.business) || 0) - qtyToFree);
//       } else if (bType === 'executive') {
//         flight.BookedSeats.executive = Math.max(0, (Number(flight.BookedSeats.executive) || 0) - qtyToFree);
//       } else {
//         flight.BookedSeats.economy = Math.max(0, (Number(flight.BookedSeats.economy) || 0) - qtyToFree);
//       }

//       // persist flights
//       writeJson(FLIGHTS_FILE, flights);
//     }

//     return res.json({ message: 'Booking cancelled', booking });
//   } catch (err) {
//     next(err);
//   }
// };

exports.cancelBookingByPNR = (req, res, next) => {
  try {
    const customerId = req.user?.id;
    if (!customerId)
      return res.status(401).json({ message: "Unauthorized" });

    const pnr = String(req.params.pnr || "").trim().toUpperCase();
    if (!pnr) return res.status(400).json({ message: "PNR required" });

    const bookings = readJson(BOOKINGS_FILE) || [];
    const flights = readJson(FLIGHTS_FILE) || [];

    const index = bookings.findIndex(
      b => String(b.PNR).toUpperCase() === pnr
    );

    if (index === -1)
      return res.status(404).json({ message: "Booking not found" });

    const booking = bookings[index];

    // Check if customer owns this booking
    if (Number(booking.CustomerId) !== Number(customerId))
      return res.status(403).json({ message: "Not your booking" });

    // Prevent duplicate cancellation
    if (booking.BookingStatus !== "Booked")
      return res.status(400).json({ message: "Booking already cancelled" });

    // Cancel
    booking.BookingStatus = "CancelledByCustomer";
    booking.CancelledAt = new Date().toISOString();

    // Refund ONLY THIS CUSTOMER
    try {
      // load carrier refund rules and flight departure
      const carriers = readJson('carriers.json') || [];
      const flightForBooking = flights.find(
        f => f.flightNumber.toLowerCase() === booking.flightNumber.toLowerCase()
      );

      // find carrier by name (case-insensitive)
      const carrierName = (flightForBooking && (flightForBooking.carrierName || flightForBooking.CarrierName)) || '';
      const carrier = carriers.find(c => String(c.CarrierName || '').toLowerCase() === String(carrierName).toLowerCase());

      const defaultRefunds = {
        "2DaysBeforeTravelDate": 0,
        "10DaysBeforeTravelDate": 20,
        "20DaysOrMoreBeforeTravelDate": 50
      };

      const refunds = (carrier && (carrier.Refunds || carrier.refunds)) || defaultRefunds;

      // determine days until departure
      const departureRaw = flightForBooking && (flightForBooking.departureTime || flightForBooking.departure || flightForBooking.DepartureTime);
      let percent = 0;
      if (!departureRaw) {
        // unknown departure -> fall back to full refund
        percent = 100;
      } else {
        const now = new Date();
        const departure = new Date(departureRaw);
        if (isNaN(departure.getTime())) {
          percent = 100;
        } else {
          const diffDays = (departure - now) / (1000 * 60 * 60 * 24);
          if (diffDays >= 20) percent = Number(refunds["20DaysOrMoreBeforeTravelDate"] || refunds["20days"] || 0);
          else if (diffDays >= 10) percent = Number(refunds["10DaysBeforeTravelDate"] || refunds["10days"] || 0);
          else if (diffDays >= 2) percent = Number(refunds["2DaysBeforeTravelDate"] || refunds["2days"] || 0);
          else percent = 0; // within 2 days -> no refund unless carrier specifies otherwise
        }
      }

      const paid = Number(booking.PricePaid) || 0;
      booking.RefundAmount = Math.round((paid * (percent / 100)) * 100) / 100;
    } catch (rfErr) {
      // on error, fallback to full refund
      console.error('Refund calc error:', rfErr && rfErr.message);
      booking.RefundAmount = booking.PricePaid;
    }

    // Restore seats
    const flight = flights.find(
      f => f.flightNumber.toLowerCase() === booking.flightNumber.toLowerCase()
    );

    if (flight) {
      const qty = Number(booking.quantity);
      const type = booking.type;

      // Ensure structure
      flight.BookedSeats = flight.BookedSeats || {
        economy: 0,
        business: 0,
        executive: 0,
      };

      if (type === "economy") flight.BookedSeats.economy -= qty;
      else if (type === "business") flight.BookedSeats.business -= qty;
      else if (type === "executive") flight.BookedSeats.executive -= qty;
    }

    writeJson(BOOKINGS_FILE, bookings);
    writeJson(FLIGHTS_FILE, flights);

    return res.json({
      message: "Ticket cancelled by customer",
      booking,
    });
  } catch (err) {
    next(err);
  }
};


//------------------ADMIN CANCEL FLIGHT ------------------------
// exports.adminCancelFlight = (req, res, next) => {
//   try {
//     // requireAuth('admin') must be used on route
//     const { flightNumber } = req.params;
//     if (!flightNumber) return res.status(400).json({ message: 'flightNumber required' });

//     const flights = readJson(FLIGHTS_FILE) || [];
//     const flight = flights.find(f => f.flightNumber === flightNumber);
//     if (!flight) return res.status(404).json({ message: 'Flight not found' });

//     // mark flight cancelled
//     flight.FlightStatus = 'Cancelled';
//     writeJson(FLIGHTS_FILE, flights);

//     // update bookings for this flight
//     const bookings = readJson(BOOKINGS_FILE) || [];
//     let changed = 0;
//     bookings.forEach(b => {
//       if (b.flightNumber === flightNumber && b.BookingStatus === 'Booked') {
//         b.BookingStatus = 'CancelledByAdmin';
//         b.CancelledAt = new Date().toISOString();
//         b.RefundAmount = null; // to be calculated later
//         changed++;
//       }
//     });
//     writeJson(BOOKINGS_FILE, bookings);

//     // reset booked seats to 0 for the flight (since all bookings cancelled)
//     flight.BookedSeats = 0;
//     writeJson(FLIGHTS_FILE, flights);

//     return res.json({ message: 'Flight cancelled by admin', cancelledBookings: changed });
//   } catch (err) {
//     next(err);
//   }
// };

exports.adminCancelFlight = (req, res, next) => {
  try {
    const { flightNumber } = req.params;
    if (!flightNumber)
      return res.status(400).json({ message: "flightNumber required" });

    const flights = readJson(FLIGHTS_FILE) || [];
    const bookings = readJson(BOOKINGS_FILE) || [];

    const flight = flights.find(
      f => f.flightNumber.toLowerCase() === flightNumber.toLowerCase()
    );

    if (!flight)
      return res.status(404).json({ message: "Flight not found" });

    // Cancel the flight
    flight.FlightStatus = "Cancelled";

    let cancelledCount = 0;

    // Cancel all customer bookings for this flight
    bookings.forEach(b => {
      if (
        b.flightNumber.toLowerCase() === flightNumber.toLowerCase() &&
        b.BookingStatus === "Booked"
      ) {
        b.BookingStatus = "CancelledByAdmin";
        b.CancelledAt = new Date().toISOString();
        b.RefundAmount = b.PricePaid; // FULL refund
        cancelledCount++;
      }
    });

    // Reset all booked seats
    flight.BookedSeats = { economy: 0, business: 0, executive: 0 };

    writeJson(FLIGHTS_FILE, flights);
    writeJson(BOOKINGS_FILE, bookings);

    return res.json({
      message: "Flight cancelled by admin",
      cancelledBookings: cancelledCount,
    });
  } catch (err) {
    next(err);
  }
};


// ------------------ Admin: View all bookings ------------------
exports.listAllBookings = (req, res, next) => {
  try {
    const bookings = readJson(BOOKINGS_FILE) || [];
    const flights = readJson(FLIGHTS_FILE) || [];

    // Utility to normalize
    const norm = (x) => String(x || "").trim().toLowerCase();

    const result = bookings
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

function generateSeatNumbers(passengers) {
  const seatsPerRowAvailable = [1,2,3,4,5];
  const letters = 'ABCDEF';
  
  const assignedSeats = [];
  
  passengers.forEach((passenger, index) => {
    const row = Math.floor(index / seatsPerRowAvailable.length) + 1;
    const seatIndex = index % seatsPerRowAvailable.length;
    const seatLetterIndex = seatsPerRowAvailable[seatIndex % seatsPerRowAvailable.length];
    
    assignedSeats.push({
      ...passenger,
      seat: `${row}${letters[seatLetterIndex - 1]}`
    });
  });
  
  return assignedSeats;
}

function formatDateTimeIntl(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date).replace(',', '');
}

exports.getBoardingPass = (req, res, next) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const bookings = readJson(BOOKINGS_FILE) || [];
    const flights = readJson(FLIGHTS_FILE) || [];
    const bookingId = req.params.bookingId;

    const booking = bookings.find(
      (b) =>
        Number(b.BookingId) === Number(bookingId) && Number(b.CustomerId) === Number(customerId)
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const flight = flights.find((f) => f.flightNumber === booking.flightNumber);

    booking.passengers = generateSeatNumbers(booking.passengers);
    flight.departureTime = formatDateTimeIntl(flight.departureTime);
    flight.arrivalTime = formatDateTimeIntl(flight.arrivalTime);
    // Create a PDF document
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=boarding-pass-${bookingId}.pdf`
    );

    doc.pipe(res);

    const margin = 50;
    const centerX = 300;
    const leftCol = margin;
    const rightCol = 250;
    const lineHeight = 20;

    doc
      .fontSize(36)
      .font('Helvetica-Bold')
      .fillColor("orange")
      .text("Go", centerX - 80, 80)
      .fillColor("black")
      .text("Voyage", centerX - 30, 80)
      .fillColor("black")
      .font('Helvetica')
      .fontSize(14)
      .text("BOARDING PASS", centerX - 50, 120);

    // Flight Information Section
    let yPos = 160;
    doc
      .fontSize(18)
      .fillColor("#333")
      .text("Flight Information", leftCol, yPos, { underline: true });
    yPos += lineHeight + 5;

    // From-To on same line
    doc.fontSize(12).fillColor("#666").text("From:", leftCol, yPos);
    doc
      .fontSize(14)
      .fillColor("#333")
      .text(`${flight?.source || "N/A"}`, rightCol, yPos);
    doc.fontSize(12).fillColor("#666").text("To:", leftCol, yPos + lineHeight);
    doc
      .fontSize(14)
      .fillColor("#333")
      .text(`${flight?.destination || "N/A"}`, rightCol, yPos + lineHeight);

    yPos += lineHeight * 2;

    // Times below cities
    doc.fontSize(12).fillColor("#666").text("Departure:", leftCol, yPos);
    doc
      .fontSize(14)
      .fillColor("#333")
      .text(`${flight?.departureTime || "N/A"}`, rightCol, yPos);
    doc.fontSize(12).fillColor("#666").text("Arrival:", leftCol, yPos + lineHeight);
    doc
      .fontSize(14)
      .fillColor("#333")
      .text(`${flight?.arrivalTime || "N/A"}`, rightCol, yPos + lineHeight);

    yPos += lineHeight * 2.5;

    // Separator line
    doc
      .lineWidth(1)
      .strokeColor("#ddd")
      .moveTo(leftCol, yPos)
      .lineTo(550, yPos)
      .stroke();
    yPos += 20;

    // Passenger Details
    doc
      .fontSize(18)
      .fillColor("#333")
      .text("Passenger Details", leftCol, yPos, { underline: true });
    yPos += lineHeight + 10;

    booking.passengers.forEach((passenger, index) => {
      doc.fontSize(14).fillColor("#333");
      doc.text(`${index + 1}. ${passenger.name}`, leftCol, yPos);
      doc
        .fontSize(12)
        .fillColor("#666")
        .text(`Seat: ${passenger.seat || "N/A"}`, rightCol, yPos)
        .text(`Age: ${passenger.age || "N/A"}`, 450, yPos, { align: "right" });
      yPos += lineHeight * 1.8;
    });

    // Booking Summary (right side)
    const bookingY = 160;
    doc.fontSize(11).fillColor("#333");
    [
      `Booking ID: ${booking.BookingId}`,
      `PNR: ${booking.PNR}`,
      `Amount: Rs.${booking.PricePaid}`,
      `Status: ${booking.BookingStatus}`,
    ].forEach((info, i) => {
      doc.text(info, 380, bookingY + i * 16 + 25, {
        width: 180,
        align: "right",
      });
    });

    // Footer
    yPos += 10;
    doc
      .lineWidth(1)
      .strokeColor("#ddd")
      .moveTo(leftCol, yPos)
      .lineTo(550, yPos)
      .stroke();
    yPos += 20;
    doc
      .fontSize(10)
      .fillColor("#999")
      .text(
        "Please arrive 45 minutes before departure. Have your ID ready.",
        centerX - 100,
        yPos,
        { align: "center", width: 400 }
      );

    doc.end();
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