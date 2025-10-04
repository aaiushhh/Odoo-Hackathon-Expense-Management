// controllers/userController.js
const User = require('../models/User');
const { hashPassword } = require('../utils/auth.utils');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const allowedRoles = ['Admin', 'Manager', 'Employee', 'CFO', 'Director'];

// ======================================================
// 👤 1. Get All Users / Employees (Admin/Manager)
// ======================================================
const getUsers = async (req, res, next) => {
  try {
    const { companyId } = req.user;

    const users = await User.find({ companyId })
      .select('-password')
      .populate('managerId', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      employees: users
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// ➕ 2. Create New User / Employee (Admin Only)
// ======================================================
const createUser = async (req, res, next) => {
  try {
    const { name, email, role, managerId, password } = req.body;
    const { companyId } = req.user;

    if (!name || !email || !role || !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing user data.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email already exists.' });
    }

    // 1️⃣ Generate password if not provided (for hackathon/demo)
    let rawPassword = password;
    if (!password) {
      rawPassword = crypto.randomBytes(8).toString('hex'); // 16 chars
    }

    // 2️⃣ Hash password (using utils or bcrypt fallback)
    const hashedPassword = password
      ? await bcrypt.hash(rawPassword, 10)
      : await hashPassword(rawPassword);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      companyId,
      managerId: managerId || null
    });

    await newUser.save();

    console.log(`[SIMULATED EMAIL] New user ${email} created. Temporary Password: ${rawPassword}`);

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse,
      tempPassword: rawPassword // For hackathon/demo purposes
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// ✏️ 3. Update User Role or Manager (Admin Only)
// ======================================================
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, managerId } = req.body;
    const { companyId } = req.user;

    const updateData = {};
    if (role && allowedRoles.includes(role)) updateData.role = role;
    if (managerId !== undefined) updateData.managerId = managerId === '' ? null : managerId;

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ success: false, message: 'No valid update fields provided.' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, companyId },
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found in company.' });

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// 🔑 4. Reset Password (Admin/Manager simulation)
// ======================================================
const resetPassword = async (req, res, next) => {
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

    if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found.' });

    console.log(`[SIMULATED EMAIL] Password reset for ${updatedUser.email}. New Password: ${rawPassword}`);

    res.status(200).json({
      success: true,
      message: `New password generated and simulated to be sent to ${updatedUser.email}.`,
      tempPassword: rawPassword
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// 👤 5. Get My Profile (Employee)
// ======================================================
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// ✏️ 6. Update My Profile (Employee)
// ======================================================
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, department } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (department) updates.department = department;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// 📦 Exports
// ======================================================
module.exports = {
  getUsers,
  createUser,
  updateUser,
  resetPassword,
  getProfile,
  updateProfile
};
