const express = require('express');
const router = express.Router();
const adminsController = require('../controllers/admins.controller');

// Backend-only admin creation - protected by BACKEND_SECRET header
router.post('/create', adminsController.createAdmin);
router.get('/dashboard', adminsController.getAdminDashboard);

// (optionally) admin list - protected by JWT admin in future
// router.get('/', adminsController.listAdmins);

module.exports = router;
