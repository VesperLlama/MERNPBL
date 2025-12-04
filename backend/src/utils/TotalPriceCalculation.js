const { readJson } = require("./jsonDb");
const CARRIERS_FILE = 'carriers.json';

function TotalPrice(customerCategory, isBulk, flight, type, qty){
    const carriers = readJson(CARRIERS_FILE) || [];
    const carrier = carriers.find(c => c.CarrierName && c.CarrierName.toLowerCase() === (flight.carrierName || flight.CarrierName || '').toLowerCase());

    let advancePercent = 0;
    let bulkPercent = 0;
    let tierPercent = 0;

    if (carrier && carrier.Discounts) {
      const d = carrier.Discounts;

      // parse departure date
      const depDate = new Date(String(flight.departureTime).replace(' ', 'T'));
      if (!isNaN(depDate.getTime())) {
        const now = new Date();
        const msPerDay = 24 * 60 * 60 * 1000;
        const depStart = new Date(Date.UTC(depDate.getUTCFullYear(), depDate.getUTCMonth(), depDate.getUTCDate()));
        const nowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const daysDiff = Math.floor((depStart - nowStart) / msPerDay);

        const days90 = Number(d['90DaysAdvanceBooking'] || 0);
        const days60 = Number(d['60DaysAdvanceBooking'] || 0);
        const days30 = Number(d['30DaysAdvanceBooking'] || 0);

        if (daysDiff >= 90 && days90 > 0) advancePercent = days90;
        else if (daysDiff >= 60 && days60 > 0) advancePercent = days60;
        else if (daysDiff >= 30 && days30 > 0) advancePercent = days30;
      }

      // bulk booking percent
      if(isBulk) bulkPercent = Number(d['BulkBooking'] || 0);
      tierPercent = carrier.userDiscounts[customerCategory];
    }

    // determine per-seat base price by class
    let basePerSeat = Number(flight.price) || 0;

    if (type === "business") basePerSeat = basePerSeat * 1.5 * qty;
    else if (type === "executive") basePerSeat = basePerSeat * 2.25 * qty;
    else if (!type || type === "economy") {
        type = 'economy';
        basePerSeat = basePerSeat * qty;
    }

    // Combine discounts (additive). If you want multiplicative, change logic.
    const totalPercentPerSeat = advancePercent + bulkPercent + tierPercent;

    // Calculate price per seat after combined discount
    const perSeatAfterDiscount = Math.round((basePerSeat * (1 - totalPercentPerSeat / 100)) * 100) / 100;

    // Total pricePaid = perSeatAfterDiscount * quantity
    const pricePaid = Math.round(perSeatAfterDiscount * 100) / 100;

    return({
        "basePrice": basePerSeat,
        "advanceDiscount": basePerSeat * (advancePercent/100),
        "categoryDiscount": basePerSeat * (tierPercent/100),
        "bulkDiscount": basePerSeat * (bulkPercent/100),
        "finalPrice": pricePaid
    });
}

module.exports = {
    TotalPrice
};