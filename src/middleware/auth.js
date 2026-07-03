const identityRepository = require('../repositories/identityRepository');
const identityRules = require('../domain/identity/IdentityRules');

/**
 * Middleware to authenticate requests via JWT.
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  try {
    // Decode via pure IdentityRules domain service
    const decoded = identityRules.decodeToken(token);
    
    // Fetch user via Identity Repository
    const user = await identityRepository.findById(decoded.id);

    if (!user) {
      return res.status(403).json({ error: 'User session invalid.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('JWT Verification error:', err);
    return res.status(403).json({ error: err.message || 'Session expired or token invalid. Please log in again.' });
  }
}

/**
 * Middleware to verify Admin role.
 */
function requireAdmin(req, res, next) {
  if (req.user && identityRules.isAuthorizedForRole(req.user.role, ['admin'])) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
}

/**
 * Middleware to verify Delivery Agent role.
 */
function requireAgent(req, res, next) {
  if (req.user && identityRules.isAuthorizedForRole(req.user.role, ['delivery_agent'])) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Delivery agent account required.' });
  }
}

/**
 * Middleware to verify Customer role.
 */
function requireCustomer(req, res, next) {
  if (req.user && identityRules.isAuthorizedForRole(req.user.role, ['customer'])) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Customer account required.' });
  }
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAgent,
  requireCustomer
};
