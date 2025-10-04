const User = require("../models/User");
const { hashPassword } = require("../utils/auth.utils");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// ⚠️ NOTE: For sending emails, you would need a service like Nodemailer.
// For this example, the password generation/email is simulated.

const allowedRoles = ["Admin", "Manager", "Employee", "CFO", "Director"];

/**
 * GET /api/company/users
 * Fetches all users for the Admin's company.
 */
const getUsers = async (req, res, next) => {
  try {
    const { companyId } = req.user;

    // Fetch users, and populate the managerId field to get the manager's name/email
    const users = await User.find({ companyId })
      .select("-password") // Exclude password field
      .populate("managerId", "name email") // Only select name and email from manager
      .lean(); // Convert to plain JavaScript objects

    res.status(200).json({
      success: true,
      employees: users,
    });
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
    const { name, email, role, managerId, password } = req.body;

    if (!name || !email || !role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing user data.",
      });
    }

    // 1. Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    // 2. Hash password (using bcrypt from HEAD)
    const hashedPassword = await bcrypt.hash(password, 10);

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

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        companyId: newUser.companyId,
      },
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
      updateData.managerId = managerId === "" ? null : managerId;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid update fields provided.",
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, companyId }, // Ensure update is within company
      { $set: updateData },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in company.",
      });
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
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

    const rawPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await hashPassword(rawPassword);

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, companyId },
      { $set: { password: hashedPassword } },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    console.log(
      `[SIMULATED EMAIL] Password reset for ${updatedUser.email}. New Password: ${rawPassword}`
    );

    res.status(200).json({
      success: true,
      message: `New password generated and simulated to be sent to ${updatedUser.email}.`,
      tempPassword: rawPassword, // For hackathon demo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/profile
 * Get the currently authenticated user's profile.
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/profile
 * Update the currently authenticated user's profile.
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, department } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (department) updates.department = department;

    const user = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  sendPassword,
  getProfile,
  updateProfile,
};
