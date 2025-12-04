/**
 * flights.controller.js
 * Simple JSON-based CRUD for flights
 */

const fs = require("fs");
const path = require("path");
const Flight = require("../../models/flights.model");

// Correct paths into data/
const flightsPath = path.join(__dirname, "../../data/flights.json");
const carriersPath = path.join(__dirname, "../../data/carriers.json");

// Simple JSON helpers
const readJSON = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    return [];
  }
};
const writeJSON = (filePath, data) =>
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));


// ===============================================================
//                   ADD FLIGHT
// ===============================================================

function generateFlightId() {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A–Z
  const digits = Math.floor(100 + Math.random() * 900); // 100–999
  return `${letter}${digits}`;
}

exports.addFlight = (req, res) => {
  try {
    const totalSeats = Number(req.body.TotalSeats || req.body.totalSeats) || 0;

    const {
      carrierName,
      source,
      destination,
      departureTime,
      arrivalTime,
      price,
      seats
    } = req.body;

    if (!carrierName || !source || !destination || !departureTime || !arrivalTime || !price) {
      return res.status(400).json({
        message: "carrierName, source, destination, departureTime, arrivalTime and price are required"
      });
    }

    const flights = readJSON(flightsPath);
    const carriers = readJSON(carriersPath);

    // Validate carrier exists
    const carrierExists = carriers.some(
      c =>
        c.CarrierName &&
        c.CarrierName.toLowerCase() === carrierName.toLowerCase()
    );

    if (!carrierExists) {
      return res.status(404).json({ message: "Carrier not found" });
    }

    // Auto-generate unique flight number (A999 format)
    let flightNumber;
    do {
      flightNumber = generateFlightId();
    } while (flights.some(f => f.flightNumber === flightNumber));

    const newFlight = new Flight(
      flightNumber,
      carrierName,
      source,
      destination,
      departureTime,
      arrivalTime,
      price,
      seats
    );

    // Ensure seats & status fields included
    newFlight.TotalSeats = seats.economy + seats.executive + seats.business;
    newFlight.BookedSeats = 0;
    newFlight.FlightStatus = "Active";
    

    flights.push(newFlight);
    writeJSON(flightsPath, flights);

    return res.status(201).json({
      message: "Flight added successfully",
      data: newFlight
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


exports.getAllFlights = (req, res) => {
  try {
    const flights = readJSON(flightsPath);
    return res.status(200).json(flights);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


// ===============================================================
//               GET FLIGHT BY flightNumber
// ===============================================================

exports.getFlightByNumber = (req, res) => {
  try {
    const { flightNumber } = req.params;
    const flights = readJSON(flightsPath);

    const flight = flights.find(f => f.flightNumber === flightNumber);

    if (!flight) {
      return res.status(404).json({ message: "Flight not found" });
    }

    // Hide cancelled flights from customers
    if (flight.FlightStatus === "Cancelled") {
      return res.status(404).json({ message: "Flight not found" });
    }

    return res.status(200).json(flight);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


exports.updateFlight = (req, res) => {
  try {
    const { flightNumber } = req.params;
    const {
      carrierName,
      source,
      destination,
      departureTime,
      arrivalTime,
      price,
      seats
    } = req.body;

    const flights = readJSON(flightsPath);
    const carriers = readJSON(carriersPath);

    const index = flights.findIndex(f => f.flightNumber === flightNumber);

    if (index === -1) {
      return res.status(404).json({ message: "Flight not found" });
    }

    const flight = flights[index];

    // If flight is cancelled, prevent updates
    if (flight.FlightStatus === "Cancelled") {
      return res.status(400).json({
        message: "Cannot update a cancelled flight"
      });
    }

    // Validate carrier exists (if updating carrierName)
    if (carrierName) {
      const carrierExists = carriers.some(
        c =>
          c.CarrierName &&
          carrierName &&
          c.CarrierName.toLowerCase() === carrierName.toLowerCase()
      );

      if (!carrierExists) {
        return res.status(404).json({ message: "Carrier not found" });
      }
    }

    // Prepare merged update
    const updatedFlight = {
      ...flight,
      carrierName: carrierName || flight.carrierName,
      source: source || flight.source,
      destination: destination || flight.destination,
      departureTime: departureTime || flight.departureTime,
      arrivalTime: arrivalTime || flight.arrivalTime,
      price: price ?? flight.price,
      seats: seats || flight.seats
    };
    
    // Update total seats (respect BookedSeats)
    const newTotalSeats = Number(seats.economy + seats.executive + seats.business);
    if (!isNaN(newTotalSeats) && newTotalSeats > 0) {
      updatedFlight.TotalSeats = newTotalSeats;

      // Ensure BookedSeats does not exceed TotalSeats
      if (updatedFlight.BookedSeats > newTotalSeats) {
        updatedFlight.BookedSeats = newTotalSeats;
      }
    }

    flights[index] = updatedFlight;
    writeJSON(flightsPath, flights);

    return res.status(200).json({
      message: "Flight updated successfully",
      data: updatedFlight
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

