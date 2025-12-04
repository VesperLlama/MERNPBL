const bcrypt = require('bcryptjs');
const { readJson, writeJson, getNextId } = require('../utils/jsonDb'); 
// const { validateCarrier } = require('../utils/validators'); 

const ADMINS_FILE = 'admins.json';
const BACKEND_SECRET = process.env.BACKEND_SECRET || 'dev_backend_secret';

// Data file names used by this controller
const FLIGHTS_FILE = 'flights.json';
const CARRIERS_FILE = 'carriers.json';
const BOOKINGS_FILE = 'bookings.json';
const CUSTOMERS_FILE = 'customers.json';

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
  console.log('getAdminDashboard called');
  try {
    // Must be admin (handled by middleware)

    // Read JSON DB (defensive)
    let flights = [];
    let carriers = [];
    let bookings = [];
    let customers = [];
    try {
      flights = readJson(FLIGHTS_FILE) || [];
      carriers = readJson(CARRIERS_FILE) || [];
      bookings = readJson(BOOKINGS_FILE) || [];
      customers = readJson(CUSTOMERS_FILE) || [];
    } catch (readErr) {
      console.error('Failed to read data files for admin dashboard:', readErr);
      return res.status(500).json({ message: 'Failed to read dashboard data', detail: String(readErr.message || readErr) });
    }

    try {
      // 1. Total flights
      const totalFlights = Array.isArray(flights) ? flights.length : 0;

      // 2. Total carriers
      const totalCarriers = Array.isArray(carriers) ? carriers.length : 0;

      // 3. Total revenue
      const totalRevenue = (Array.isArray(bookings) ? bookings : [])
        .filter(b => b.BookingStatus === "Booked") // only active bookings
        .reduce((sum, b) => sum + Number(b.PricePaid || 0), 0);

      // 4. Total bookings
      const totalBookings = Array.isArray(bookings) ? bookings.length : 0;

      // 5. Upcoming bookings
      const now = new Date();
      const upcomingBookings = (Array.isArray(bookings) ? bookings : []).filter(b => {
        const flight = (Array.isArray(flights) ? flights : []).find(f => f.flightNumber === b.flightNumber);
        if (!flight) return false;

        const dep = new Date(String(flight.departureTime || '').replace(" ", "T"));
        if (isNaN(dep.getTime())) return false;

        return dep > now && b.BookingStatus === "Booked";
      }).length;

      // 6. Total customers
      const totalCustomers = Array.isArray(customers) ? customers.length : 0;

      // include admin info if available on req.user (set by auth middleware)
      const adminName = (req.user && (req.user.FullName || req.user.name)) || '';
      const adminId = (req.user && (req.user.AdminId || req.user.id)) || '';

      return res.json({
        data: {
          totalFlights,
          totalCarriers,
          totalRevenue,
          totalBookings,
          upcomingBookings,
          totalCustomers,
          adminName,
          adminId
        }
      });
    } catch (calcErr) {
      console.error('Error computing dashboard stats:', calcErr);
      return res.status(500).json({ message: 'Failed to compute dashboard stats', detail: String(calcErr.message || calcErr) });
    }
  } catch (err) {
    console.error('Unexpected error in getAdminDashboard:', err);
    return res.status(500).json({ message: 'Failed to load dashboard', detail: String(err.message || err) });
  }
};
