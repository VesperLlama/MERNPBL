const bcrypt = require('bcryptjs');
const { readJson, writeJson, getNextId } = require('../utils/jsonDb');
const { validateCustomerRegister } = require('../utils/validators');

const CUSTOMERS_FILE = 'customers.json';
exports.checkEmail = (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const customers = readJson(CUSTOMERS_FILE);

    const exists = customers.find(
      c => c.EmailId?.toLowerCase() === email.toLowerCase()
    );

    if (!exists) {
      return res.status(404).json({ message: "Email not found in system" });
    }

    return res.json({ message: "Email verified" });

  } catch (err) {
    next(err);
  }
};
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Missing data" });
    }

    let customers = readJson(CUSTOMERS_FILE);
    const index = customers.findIndex(
      c => c.EmailId.toLowerCase() === email.toLowerCase()
    );

    if (index === -1) {
      return res.status(404).json({ message: "Email not registered" });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    customers[index].PasswordHash = hash;
    customers[index].UpdatedAt = new Date().toISOString();

    writeJson(CUSTOMERS_FILE, customers);

    return res.json({ message: "Password updated successfully" });

  } catch (err) {
    next(err);
  }
};

exports.registerCustomer = async (req, res, next) => {
  try {
    const payload = req.body || {};
    
    const normalized = {
      fullName: payload.FullName,
      email: payload.EmailId,
      password: payload.Password,
      phone: payload.Phone,
      address1: payload.AddressLine1,
      address2: payload.AddressLine2,
      city: payload.City,
      state: payload.State,
      zip: payload.ZipCode,
      dob: payload.DOB,
      CustomerCategory: payload.CustomerCategory
    };

    // Validate normalized data
    // const { error } = validateCustomerRegister(normalized);
    // if (error) {
    //   return res.status(400).json({
    //     message: "Validation failed",
    //     errors: error.details.map(d => d.message)
    //   });
    // }

    // Read users
    let customers = readJson(CUSTOMERS_FILE);
    if (!Array.isArray(customers)) customers = [];

    // FULLY WORKING UNIQUE CHECKS
    const emailExists = customers.find(
      c => c.EmailId?.toLowerCase() === normalized.email?.toLowerCase()
    );

    const phoneExists = customers.find(
      c => String(c.Phone) === String(normalized.phone)
    );

    if (emailExists || phoneExists) {
      const parts = [];
      if (emailExists) parts.push("Email");
      if (phoneExists) parts.push("Phone");

      return res.status(400).json({
        message: parts.join(" and ") + " already registered"
      });
    }

    const id = getNextId("customerId");
    const passwordHash = await bcrypt.hash(normalized.password, 10);

    const newCustomer = {
      CustomerId: id,
      FullName: normalized.fullName,
      PasswordHash: passwordHash,
      Role: "customer",
      CustomerCategory: normalized.CustomerCategory || "Silver",
      Phone: normalized.phone,
      EmailId: normalized.email,
      AddressLine1: normalized.address1,
      AddressLine2: normalized.address2 || "",
      City: normalized.city,
      State: normalized.state,
      ZipCode: normalized.zip,
      DOB: normalized.dob,
      CreatedAt: new Date().toISOString()
    };

    customers.push(newCustomer);
    writeJson(CUSTOMERS_FILE, customers);

    return res.status(201).json({ message: "Registered", CustomerId: id });

  } catch (err) {
    next(err);
  }
};

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

    if(currentPassword){
    const match = await bcrypt.compare(currentPassword, existing.PasswordHash);
    console.log(match);
    if (match) {
      if (newPassword && newPassword.trim().length > 0) {
        updated.PasswordHash = await bcrypt.hash(newPassword, 10);
      }
    }
    else {
      return res.status(401).json({ "message": "Invalid Old Password" });
    }}
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
