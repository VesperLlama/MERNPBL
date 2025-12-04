const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customers.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.post('/register', customersController.registerCustomer);
router.get('/:id', customersController.getCustomerById);
router.put('/update-profile/:id', requireAuth("customer"),customersController.updateMyProfile);

module.exports = router;
