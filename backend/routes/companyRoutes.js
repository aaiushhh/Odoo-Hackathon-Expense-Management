const express = require("express");
const router = express.Router();

// User-related imports
const {
  getUsers,
  createUser,
  updateUser,
  sendPassword,
} = require("../controllers/userController");

// Company-related imports
const {
  getCompany,
  updateCompany,
} = require("../controllers/companyController");

// Middleware imports
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

// All company/user routes require authentication and Admin role
router.use(authenticateToken);
router.use(authorizeRoles(["Admin"]));

// --- User Management Routes ---

// Fetch all users & Create new user
router
  .route("/users")
  .get(getUsers) // GET /api/company/users
  .post(createUser); // POST /api/company/users

// Update user role/manager
router.route("/users/:id").put(updateUser); // PUT /api/company/users/:id

// Send/Reset Password
router.route("/users/:id/reset-password").post(sendPassword); // POST /api/company/users/:id/reset-password

// --- Company Profile Routes ---

// Get company details (Admin only, as per the router.use above)
router.get("/", getCompany);

// Update company details (Admin only, as per the router.use above)
router.put("/", updateCompany);

module.exports = router;
