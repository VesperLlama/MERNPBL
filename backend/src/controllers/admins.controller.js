const bcrypt = require('bcryptjs');
const { readJson, writeJson, getNextId } = require('../utils/jsonDb'); 
// const { validateCarrier } = require('../utils/validators'); 

const ADMINS_FILE = 'admins.json';
const BACKEND_SECRET = process.env.BACKEND_SECRET || 'dev_backend_secret';

exports.createAdmin = async (req, res, next) => {
  try {
    // Require backend secret header
    const secret = req.headers['x-backend-secret'];
    if (!secret || secret !== BACKEND_SECRET) {
      return res.status(403).json({ message: 'Forbidden: missing or invalid backend secret' });
    }

    const { FullName, EmailId, Password } = req.body || {};

    if (!FullName || !EmailId || !Password) {
      return res.status(400).json({
        message: 'FullName, EmailId and Password are required'
      });
    }

    if (typeof FullName !== 'string' || FullName.trim().length < 3) {
      return res.status(400).json({
        message: 'FullName must be at least 3 characters'
      });
    }

    // Read admins.json normally
    let admins = readJson(ADMINS_FILE);
    if (!Array.isArray(admins)) admins = [];

    // Check duplicate email
    const duplicate = admins.find(
      a => a.EmailId && a.EmailId.toLowerCase() === EmailId.toLowerCase()
    );

    if (duplicate) {
      return res.status(400).json({ message: 'Email already registered as admin' });
    }

    // Generate next ID (non-atomic simple version)
    const nextId = getNextId('adminId');

    // Hash password
    const passwordHash = await bcrypt.hash(Password, 10);

    const admin = {
      AdminId: nextId,
      FullName,
      EmailId,
      PasswordHash: passwordHash,
      CreatedAt: new Date().toISOString()
    };

    // Push and write back
    admins.push(admin);
    writeJson(ADMINS_FILE, admins);

    return res.status(201).json({
      message: 'Admin created',
      AdminId: nextId
    });

  } catch (err) {
    next(err);
  }
};

exports.getAdminDashboard = (req, res, next) => {
  try {
    // Must be admin (handled by middleware)

    // Read JSON DB
    const flights = readJson(FLIGHTS_FILE) || [];
    const carriers = readJson(CARRIERS_FILE) || [];
    const bookings = readJson(BOOKINGS_FILE) || [];
    const customers = readJson(CUSTOMERS_FILE) || [];

    // 1. Total flights
    const totalFlights = flights.length;

    // 2. Total carriers
    const totalCarriers = carriers.length;

    // 3. Total revenue
    const totalRevenue = bookings
      .filter(b => b.BookingStatus === "Booked") // only active bookings
      .reduce((sum, b) => sum + Number(b.PricePaid || 0), 0);

    // 4. Total bookings
    const totalBookings = bookings.length;

    // 5. Upcoming bookings
    const now = new Date();
    const upcomingBookings = bookings.filter(b => {
      const flight = flights.find(f => f.flightNumber === b.flightNumber);
      if (!flight) return false;

      const dep = new Date(String(flight.departureTime).replace(" ", "T"));
      if (isNaN(dep.getTime())) return false;

      return dep > now && b.BookingStatus === "Booked";
    }).length;

    // 6. Total customers
    const totalCustomers = customers.length;

    return res.json({
      data: {
        totalFlights,
        totalCarriers,
        totalRevenue,
        totalBookings,
        upcomingBookings,
        totalCustomers,
      }
    });

  } catch (err) {
    next(err);
  }
};
