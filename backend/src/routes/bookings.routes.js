const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookings.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// Customer routes
router.post('/book', requireAuth('customer'), bookingsController.bookFlight);
router.put('/cancel/:pnr', requireAuth('customer'), bookingsController.cancelBookingByPNR);
router.get('/list', requireAuth('customer'), bookingsController.listMyBookings);
router.post('/calculatePrice', requireAuth('customer'), bookingsController.calculatePrice);

// Admin routes
router.put('/admin-cancel-flight/:flightNumber', requireAuth('admin'), bookingsController.adminCancelFlight);
router.get('/all', requireAuth('admin'), bookingsController.listAllBookings);

module.exports = router;