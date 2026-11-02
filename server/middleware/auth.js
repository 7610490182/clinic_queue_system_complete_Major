const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * authenticateToken (auth)
 * Validates JWT, verifies user in DB, and enforces active account status.
 * Rejects deactivated user sessions immediately with 403 Forbidden.
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No authorization header provided' });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'clinic-queue-jwt-default-secret-key-2026';
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtErr) {
      return res.status(401).json({ message: 'Invalid or expired token', error: jwtErr.message });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found or account deleted' });
    }

    // Check account active status - Immediate rejection for deactivated accounts
    if (user.isActive === false) {
      return res.status(403).json({
        message: 'Your account has been deactivated. Access denied. Please contact clinic administration.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

/**
 * authorizeRoles(...allowedRoles)
 * Restricts endpoint to explicitly permitted roles.
 * Never trusts role from frontend request body or headers; always checks DB-backed req.user.role.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Insufficient permissions for role '${req.user.role}'. Required role(s): ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Helper shortcuts for common role checks
 */
const adminAuth = authorizeRoles('admin');
const doctorAuth = authorizeRoles('doctor');
const patientAuth = authorizeRoles('patient');

/**
 * Helper to log sensitive actions to the AuditLog collection
 */
const logAuditAction = async ({ user, action, resource, targetPatientId, details, ip, status = 'SUCCESS' }) => {
  try {
    await AuditLog.create({
      userId: user?._id || user?.id,
      userName: user?.name || 'System',
      userRole: user?.role || 'system',
      action,
      resource,
      targetPatientId: targetPatientId || null,
      details: details || {},
      ipAddress: ip || '127.0.0.1',
      status,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('AuditLog writing failed:', err.message);
  }
};

module.exports = {
  auth,
  authenticateToken: auth,
  authorizeRoles,
  adminAuth,
  doctorAuth,
  patientAuth,
  logAuditAction
};
