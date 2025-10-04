const User = require('../models/User');
const Company = require('../models/Company');
const mongoose = require('mongoose');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth.utils');

/**
 * POST /api/auth/signup
 * Creates a new company and its first Admin user in a single transaction.
 */
const signup = async (req, res, next) => {
    // Start a MongoDB session for transactional integrity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { 
            name, 
            email, 
            password, 
            companyName, 
            companyCountry, 
            companyCurrency 
        } = req.body;

        // 1. Basic Input Validation
        if (!name || !email || !password || !companyName || !companyCountry || !companyCurrency) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required.' 
            });
        }

        // 2. Check for existing User (by email)
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ 
                success: false,
                message: 'User with this email already exists.' 
            });
        }

        // 3. Hash Password
        const hashedPassword = await hashPassword(password);

        // 4. Create Admin User
        const adminUser = new User({
            name,
            email,
            password: hashedPassword,
            role: 'Admin',
        });
        await adminUser.save({ session });
        
        // 5. Create Company
        const newCompany = new Company({
            name: companyName,
            country: companyCountry,
            currency: companyCurrency.toUpperCase(),
            adminId: adminUser._id,
        });
        await newCompany.save({ session });
        
        // 6. Update Admin User with the new companyId
        adminUser.companyId = newCompany._id;
        await adminUser.save({ session });

        // 7. Commit Transaction
        await session.commitTransaction();
        session.endSession();

        // 8. Generate Token and Respond
        const token = generateToken({ 
            userId: adminUser._id, 
            role: adminUser.role, 
            companyId: newCompany._id 
        });

        res.status(201).json({ 
            success: true, 
            message: 'Company and Admin created successfully.',
            token, 
            user: {
                id: adminUser._id,
                name: adminUser.name,
                email: adminUser.email,
                role: adminUser.role,
                companyId: newCompany._id,
            }
        });

    } catch (error) {
        // Rollback transaction on error
        await session.abortTransaction();
        session.endSession();
        console.error("Signup Transaction Failed:", error);
        next(error); 
    }
};

/**
 * POST /api/auth/login
 * Logs in a user and returns a JWT.
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required.' 
            });
        }

        // 1. Find user, explicitly select password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials.' 
            });
        }

        // 2. Compare password
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials.' 
            });
        }

        // 3. Generate Token
        const token = generateToken({ 
            userId: user._id, 
            role: user.role, 
            companyId: user.companyId 
        });

        // 4. Respond
        res.status(200).json({ 
            success: true, 
            message: 'Login successful.', 
            token, 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    signup,
    login
};