const express = require('express');
const router = express.Router();
const carriersController = require('../controllers/carriers.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// All carrier routes require admin role
router.post('/register', requireAuth('admin'), carriersController.registerCarrier);
router.put('/update/:id', requireAuth('admin'), carriersController.updateCarrier);
router.get('/list', carriersController.listCarriers);
router.get('/:id', requireAuth('admin'), carriersController.getCarrierById);

module.exports = router;
