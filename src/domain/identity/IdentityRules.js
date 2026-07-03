const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_last_mile_delivery_tracker_key_2026';

class IdentityRules {
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  generateToken(userId, role) {
    return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '24h' });
  }

  decodeToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw new Error('Session invalid or expired. Please log in again.');
    }
  }

  isAuthorizedForRole(userRole, requiredRoles = []) {
    if (requiredRoles.length === 0) return true;
    return requiredRoles.includes(userRole);
  }
}

module.exports = new IdentityRules();
