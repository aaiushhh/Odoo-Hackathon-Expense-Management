const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Ensure you have a strong secret in your .env file
<<<<<<< HEAD
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_for_hackathon';
=======
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_for_hackathon'; 
>>>>>>> 763fc7dbfb2a8fa88285739a062288fa22ad2b2e

// --- Password Hashing ---
const hashPassword = async (password) => {
    // 10 rounds is standard for security
    const salt = await bcrypt.genSalt(10); 
    return bcrypt.hash(password, salt);
};

const comparePassword = (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};

// --- JWT Token Management ---
const generateToken = (payload) => {
    // Token expires in 1 day
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }); 
};

// You might need a utility to verify the token in middleware later
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null; // Token is invalid or expired
    }
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken
};