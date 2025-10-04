const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_for_hackathon';

/**
 * Middleware to verify JWT and attach user payload to req.user
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Contains { userId, role, companyId }
        next();
    } catch (error) {
        // Token is invalid or expired
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

/**
 * Middleware to restrict access based on user role.
 * @param {Array<String>} allowedRoles - e.g., ['Admin', 'Manager']
 */
const authorizeRoles = (allowedRoles) => (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
            message: `Forbidden. Role ${req.user ? req.user.role : 'None'} does not have permission.` 
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    authorizeRoles
};