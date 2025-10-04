const express = require("express");
const { signup, login } = require("../controllers/authController");
const router = express.Router();
const auth = require("../middlewares/authMiddleware"); // JWT middleware
const { isAdmin } = require("../middlewares/roleMiddleware"); // Role-based check
const { getApprovalStatus } = require("../controllers/approvalController");

// Protect this route with JWT + only Admins can access
router.get("/:expenseId", auth, isAdmin, getApprovalStatus);

router.post("/signup", signup);
router.post("/login", login);

module.exports = router;
