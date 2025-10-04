const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Create a new employee (Admin only)
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, role, managerId } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role,
      companyId: req.user.companyId,
      managerId: managerId || null
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      }
    });
  } catch (err) {
    console.error('Create Employee Error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error('Get Profile Error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, department } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (department) updates.department = department;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get all employees in company (Admin/Manager only)
exports.getCompanyEmployees = async (req, res) => {
  try {
    const users = await User.find({ 
      companyId: req.user.companyId 
    }).select('-password').sort({ name: 1 });

    res.json({
      success: true,
      employees: users
    });
  } catch (err) {
    console.error('Get Company Employees Error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};