const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readJson } = require('../utils/jsonDb');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '6h';

const ADMINS_FILE = 'admins.json';
const CUSTOMERS_FILE = 'customers.json';

exports.login = async (req, res, next) => {
  try {
    const { EmailId, Password, isAdmin } = req.body || {};
    
    if (!EmailId || !Password) {
      return res.status(400).json({ message: 'EmailId and Password required' });
    }

    const fileName = isAdmin ? ADMINS_FILE : CUSTOMERS_FILE;
    const users = readJson(fileName);

    const user = users.find(
      u => u.EmailId && u.EmailId.toLowerCase() === EmailId.toLowerCase()
    );

    if (!user) {
      console.log("!user");
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(Password, user.PasswordHash);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = {
      id: isAdmin ? user.AdminId : user.CustomerId,
      role: isAdmin ? 'admin' : 'customer',
      name: user.FullName,
      email: user.EmailId
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    
    return res.json({ message: 'Logged in', token, user: payload });

  } catch (err) {
    next(err);
  }
};
