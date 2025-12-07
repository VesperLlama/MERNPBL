class Booking {
  constructor(BookingId, CustomerId, flightNumber, PNR, BookingStatus, BookedAt, PricePaid, CancelledAt = null, RefundAmount = null, type, qty, passengers) {
    this.BookingId = BookingId;          // integer (from meta)
    this.CustomerId = CustomerId;        // integer (from customers.json)
    this.flightNumber = flightNumber;    // e.g. A123
    this.PNR = PNR;                      // e.g. AB12CD
    this.BookingStatus = BookingStatus;  // "Booked" | "CancelledByCustomer" | "CancelledByAdmin"
    this.BookedAt = BookedAt;            // ISO string
    this.PricePaid = PricePaid;          // number
    this.CancelledAt = CancelledAt;      // ISO string or null
    this.RefundAmount = RefundAmount;    // number or null (calculated later)
    this.type = type;
    this.quantity = qty;
    this.passengers = passengers;
  }
}

module.exports = Booking;