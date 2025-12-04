/**
 * auth.middleware.js
 * JWT check middleware and role guard
 */

const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'dev_jwt_secret';

function requireAuth(requiredRole) {
  // requiredRole: 'admin' | 'customer' | null
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ message: 'Authorization header missing' });
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Invalid authorization header' });
      const token = parts[1];
      const payload = jwt.verify(token, secret);
      // payload contains role, id, name, email as we create in login
      console.log(payload.role);
      console.log(requiredRole);

      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ message: 'Forbidden: insufficient role' });
      }
      req.user = payload;
      next();
    } catch (err) {
      console.error('Auth error:', err.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}

module.exports = { requireAuth };
