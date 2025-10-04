const User = require("../models/User");
const Company = require("../models/Company");
const mongoose = require("mongoose");
const {
  hashPassword,
  comparePassword,
  generateToken,
  generateRandomPassword,
} = require("../utils/auth.utils");
const { sendEmail } = require("../utils/email.utils"); // Add this line

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
      companyCurrency,
    } = req.body;

    // 1. Basic Input Validation
    if (
      !name ||
      !email ||
      !password ||
      !companyName ||
      !companyCountry ||
      !companyCurrency
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "All fields are required." });
    }

        // 2. Check for existing User (by email)
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            await session.abortTransaction();
            session.endSession();
<<<<<<< HEAD
            return res.status(409).json({ 
                success: false,
                message: 'User with this email already exists.' 
            });
=======
            return res.status(409).json({ message: 'User with this email already exists.' });
>>>>>>> 763fc7dbfb2a8fa88285739a062288fa22ad2b2e
        }

    // 3. Hash Password
    const hashedPassword = await hashPassword(password);

<<<<<<< HEAD
=======
        // --- Core Fix: Create Admin User FIRST to get its ID ---
        
>>>>>>> 763fc7dbfb2a8fa88285739a062288fa22ad2b2e
        // 4. Create Admin User
        const adminUser = new User({
            name,
            email,
            password: hashedPassword,
<<<<<<< HEAD
            role: 'Admin',
        });
        await adminUser.save({ session });
        
        // 5. Create Company
=======
            role: 'Admin', // Hardcoded role for the initial user
            // companyId is temporarily null
        });
        await adminUser.save({ session });
        
        // 5. Create Company, using the Admin's newly created _id
>>>>>>> 763fc7dbfb2a8fa88285739a062288fa22ad2b2e
        const newCompany = new Company({
            name: companyName,
            country: companyCountry,
            currency: companyCurrency.toUpperCase(),
<<<<<<< HEAD
            adminId: adminUser._id,
=======
            adminId: adminUser._id, // ✅ Validation is satisfied here
>>>>>>> 763fc7dbfb2a8fa88285739a062288fa22ad2b2e
        });
        await newCompany.save({ session });
        
        // 6. Update Admin User with the new companyId
        adminUser.companyId = newCompany._id;
<<<<<<< HEAD
        await adminUser.save({ session });
=======
        await adminUser.save({ session }); // Save the updated Admin document
>>>>>>> 763fc7dbfb2a8fa88285739a062288fa22ad2b2e

    // 7. Commit Transaction
    await session.commitTransaction();
    session.endSession();

    // 8. Generate Token and Respond
    const token = generateToken({
      userId: adminUser._id,
      role: adminUser.role,
      companyId: newCompany._id,
    });

    res.status(201).json({
      success: true,
      message: "Company and Admin created successfully.",
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        companyId: newCompany._id,
      },
    });
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    session.endSession();
    console.error("Signup Transaction Failed:", error);
    // Pass error to global error handler
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
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // 1. Find user, explicitly select password
    // We use .select('+password') because password has select: false in the schema
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // 2. Compare password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // 3. Generate Token
    const token = generateToken({
      userId: user._id,
      role: user.role,
      companyId: user.companyId,
    });

    // 4. Respond
    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Send a success message even if the user is not found to prevent email enumeration
      return res
        .status(200)
        .json({
          message:
            "If a user with that email exists, a new password has been sent.",
        });
    }

    // 1. Generate new password
    const newPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(newPassword);

    // 2. Update user's password in the database
    user.password = hashedPassword;
    await user.save();

    // 3. Send the new password to the user's email
    const subject = "Your new password";
    const text = `Hello ${user.name},\n\nYour new password is: ${newPassword}\n\nPlease log in and change your password immediately.\n\nThank you.`;

    await sendEmail(user.email, subject, text);

    res
      .status(200)
      .json({ message: "A new password has been sent to your email address." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    next(error);
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
};
