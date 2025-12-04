const bcrypt = require('bcryptjs');
const { readJson, writeJson, getNextId } = require('../utils/jsonDb');
const { validateCustomerRegister } = require('../utils/validators');

const CUSTOMERS_FILE = 'customers.json';

exports.registerCustomer = async (req, res, next) => {
  try {
    const payload = req.body || {};

    // Read customers
    let customers = readJson(CUSTOMERS_FILE);
    if (!Array.isArray(customers)) customers = [];

    // Duplicate email check
    const emailExists = customers.find(
      c => c.EmailId && c.EmailId.toLowerCase() === String(payload.EmailId).toLowerCase()
    );
    const phoneExists = customers.find(
      c => c.Phone && String(c.Phone) === String(payload.Phone)
    );

    if (emailExists || phoneExists) {
      const parts = [];
      if (emailExists) parts.push('Email');
      if (phoneExists) parts.push('Phone');
      return res.status(400).json({ message: parts.join(' and ') + ' already registered' });
    }
    
    // Get next ID (simple version)
    const id = getNextId('customerId');

    // Hash password
    const passwordHash = await bcrypt.hash(payload.password, 10);
    const newCustomer = {
      CustomerId: id,
      FullName: payload.fullName,
      PasswordHash: passwordHash,
      Role: 'customer',
      CustomerCategory: payload.CustomerCategory || 'Silver',
      Phone: payload.phone,
      EmailId: payload.email,
      AddressLine1: payload.address1,
      AddressLine2: payload.address2 || '',
      City: payload.city,
      State: payload.state,
      ZipCode: payload.zip,
      DOB: payload.dob,
      estimateSpend: payload.estimateSpend,
      CreatedAt: new Date().toISOString()
    };

    // Save
    customers.push(newCustomer);
    writeJson(CUSTOMERS_FILE, customers);

    return res.status(201).json({
      message: 'Registered',
      CustomerId: id
    });

  } catch (err) {
    next(err);
  }
};

// password for id 1003 = "Aaditya@123"

exports.getCustomerById = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const customers = readJson(CUSTOMERS_FILE);

    const cust = customers.find(c => Number(c.CustomerId) === id);
    if (!cust) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const { PasswordHash, ...safe } = cust;
    return res.json(safe);

  } catch (err) {
    next(err);
  }
};


/**
 * Update customer's own profile
 * Allowed updates:
 * AddressLine1, AddressLine2, ZipCode, City, State, Password
 */


exports.updateMyProfile = async (req, res, next) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      address1,
      address2,
      zip,
      city,
      state,
      currentPassword,
      newPassword
    } = req.body || {};

    const customers = readJson(CUSTOMERS_FILE) || [];

    const index = customers.findIndex(
      c => Number(c.CustomerId) === Number(customerId)
    );

    if (index === -1) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const existing = customers[index];

    // Prepare updated object
    const updated = {
      ...existing,
      AddressLine1: address1 || existing.AddressLine1,
      AddressLine2: address2 ?? existing.AddressLine2,
      ZipCode: zip || existing.ZipCode,
      City: city || existing.City,
      State: state || existing.State,
      UpdatedAt: new Date().toISOString()
    };
    if(bcrypt.compare(currentPassword, existing.PasswordHash)){
      if (currentPassword && currentPassword.trim().length > 0) {
      updated.PasswordHash = await bcrypt.hash(newPassword, 10);
    }
    }
    else{
      return res.status(401).json({"message": "Invalid Old Password"});
    }
    // if(Password && Password.trim().length > 0 )
    // If updating password → hash it
    // if (Password && Password.trim().length > 0) {
    //   updated.PasswordHash = await bcrypt.hash(Password, 10);
    // }

    customers[index] = updated;
    writeJson(CUSTOMERS_FILE, customers);

    // Remove password hash before sending response
    const { PasswordHash, ...safe } = updated;

    return res.json({
      message: "Profile updated successfully",
      data: safe
    });

  } catch (err) {
    next(err);
  }
};