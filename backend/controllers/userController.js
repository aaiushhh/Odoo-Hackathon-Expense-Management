const User = require('../models/User');
const { hashPassword } = require('../utils/auth.utils');
const crypto = require('crypto');
// ⚠️ NOTE: For sending emails, you would need a service like Nodemailer. 
// For the hackathon, we'll simulate the password generation/email.

const allowedRoles = ['Admin', 'Manager', 'Employee', 'CFO', 'Director'];

/**
 * GET /api/company/users
 * Fetches all users for the Admin's company.
 */
const getUsers = async (req, res, next) => {
    try {
        const { companyId } = req.user;
        
        // Fetch users, and populate the managerId field to get the manager's name/email
        const users = await User.find({ companyId })
            .select('-password') // Exclude password field
            .populate('managerId', 'name email') // Only select name and email from manager
            .lean(); // Convert to plain JavaScript objects

        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/company/users
 * Creates a new employee/manager (Admin only).
 */
const createUser = async (req, res, next) => {
    try {
        const { companyId } = req.user;
        const { name, email, role, managerId } = req.body;

        if (!name || !email || !role || !allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid or missing user data.' });
        }

        // 1. Generate a secure random password (for email sending)
        const rawPassword = crypto.randomBytes(8).toString('hex'); // 16 char password
        const hashedPassword = await hashPassword(rawPassword);

        // 2. Check for existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        // 3. Create User
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role,
            companyId,
            managerId: managerId || null,
        });

        await newUser.save();
        
        // ⚠️ IMPORTANT: In a real app, send the rawPassword via email here.
        console.log(`[SIMULATED EMAIL] New user ${email} created. Temporary Password: ${rawPassword}`);

        // 4. Respond (do not return the password)
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({ 
            message: 'User created successfully. Password simulated to be sent.', 
            user: userResponse,
            // Include raw password in response temporarily for hackathon testing
            tempPassword: rawPassword 
        });

    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/company/users/:id
 * Updates user role or manager (Admin only).
 */
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role, managerId } = req.body;
        const { companyId } = req.user;

        const updateData = {};
        if (role && allowedRoles.includes(role)) {
            updateData.role = role;
        }
        if (managerId !== undefined) {
            updateData.managerId = managerId === '' ? null : managerId;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No valid update fields provided.' });
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: id, companyId }, // Ensure update is within company
            { $set: updateData },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found in company.' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/company/users/:id/reset-password
 * Generates new password and logs it (simulated email).
 */
const sendPassword = async (req, res, next) => {
     try {
        const { id } = req.params;
        const { companyId } = req.user;

        const rawPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await hashPassword(rawPassword);

        const updatedUser = await User.findOneAndUpdate(
            { _id: id, companyId },
            { $set: { password: hashedPassword } },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        console.log(`[SIMULATED EMAIL] Password reset for ${updatedUser.email}. New Password: ${rawPassword}`);
        
        res.status(200).json({ 
            message: `New password generated and simulated to be sent to ${updatedUser.email}.`,
            tempPassword: rawPassword // For hackathon demo
        });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    getUsers,
    createUser,
    updateUser,
    sendPassword
};