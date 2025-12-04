// /**
//  * customers.controller.js
//  * Customer registration and get-by-id
//  */

// const bcrypt = require('bcryptjs');
// const { readJson, atomicUpdate, getNextId } = require('../utils/jsonDb');
// const { validateCustomerRegister } = require('../utils/validators');

// const CUSTOMERS_FILE = 'customers.json';

// exports.registerCustomer = async (req, res, next) => {
//   try {
//     const payload = req.body || {};
//     const { error } = validateCustomerRegister(payload);
//     if (error) {
//       const messages = error.details.map(d => d.message);
//       return res.status(400).json({ message: 'Validation failed', errors: messages });
//     }

//     // atomic add
//     await atomicUpdate(CUSTOMERS_FILE, async (customers) => {
//       if (!Array.isArray(customers)) customers = [];

//       // duplicate email check
//       if (customers.find(c => c.EmailId && c.EmailId.toLowerCase() === payload.EmailId.toLowerCase())) {
//         const err = new Error('Email already registered');
//         err.status = 400;
//         throw err;
//       }

//       const id = await getNextId('customerId');
//       const passwordHash = await bcrypt.hash(payload.Password, 10);

//       const newCustomer = {
//         CustomerId: id,
//         FullName: payload.FullName,
//         PasswordHash: passwordHash,
//         Role: 'customer',
//         CustomerCategory: payload.CustomerCategory || 'Silver',
//         Phone: payload.Phone,
//         EmailId: payload.EmailId,
//         AddressLine1: payload.AddressLine1,
//         AddressLine2: payload.AddressLine2 || '',
//         City: payload.City,
//         State: payload.State,
//         ZipCode: payload.ZipCode,
//         DOB: payload.DOB,
//         CreatedAt: new Date().toISOString()
//       };

//       customers.push(newCustomer);
//       return customers;
//     });

//     // Get new id from meta.json
//     const meta = readJson('meta.json');
//     return res.status(201).json({ message: 'Registered', CustomerId: meta.customerId });
//   } catch (err) {
//     if (err.status === 400) return res.status(400).json({ message: err.message });
//     next(err);
//   }
// };

// exports.getCustomerById = (req, res, next) => {
//   try {
//     const id = Number(req.params.id);
//     const customers = readJson(CUSTOMERS_FILE);
//     const cust = customers.find(c => Number(c.CustomerId) === id);
//     if (!cust) return res.status(404).json({ message: 'Customer not found' });
//     const { PasswordHash, ...safe } = cust;
//     return res.json(safe);
//   } catch (err) {
//     next(err);
//   }
// };


/**
 * customers.controller.js
 * Customer registration and get-by-id (SIMPLE VERSION)
 */

const bcrypt = require('bcryptjs');
const { readJson, writeJson, getNextId } = require('../utils/jsonDb');
const { validateCustomerRegister } = require('../utils/validators');

const CUSTOMERS_FILE = 'customers.json';

exports.registerCustomer = async (req, res, next) => {
  try {
    const payload = req.body || {};

    // Validate request body
    const { error } = validateCustomerRegister(payload);
    if (error) {
      const messages = error.details.map(d => d.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }

    // Read customers
    let customers = readJson(CUSTOMERS_FILE);
    if (!Array.isArray(customers)) customers = [];

    // Duplicate email check
    const exists = customers.find(
      c => c.EmailId && c.EmailId.toLowerCase() === payload.EmailId.toLowerCase()
    );

    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Get next ID (simple version)
    const id = getNextId('customerId');

    // Hash password
    const passwordHash = await bcrypt.hash(payload.Password, 10);

    const newCustomer = {
      CustomerId: id,
      FullName: payload.FullName,
      PasswordHash: passwordHash,
      Role: 'customer',
      CustomerCategory: payload.CustomerCategory || 'Silver',
      Phone: payload.Phone,
      EmailId: payload.EmailId,
      AddressLine1: payload.AddressLine1,
      AddressLine2: payload.AddressLine2 || '',
      City: payload.City,
      State: payload.State,
      ZipCode: payload.ZipCode,
      DOB: payload.DOB,
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
      AddressLine1,
      AddressLine2,
      ZipCode,
      City,
      State,
      OldPassword,
      Password
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
      AddressLine1: AddressLine1 || existing.AddressLine1,
      AddressLine2: AddressLine2 ?? existing.AddressLine2,
      ZipCode: ZipCode || existing.ZipCode,
      City: City || existing.City,
      State: State || existing.State,
      UpdatedAt: new Date().toISOString()
    };
    if(bcrypt.compare(OldPassword, existing.PasswordHash)){
      if (Password && Password.trim().length > 0) {
      updated.PasswordHash = await bcrypt.hash(Password, 10);
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