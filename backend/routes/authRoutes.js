const express = require("express");
const { signup, login } = require("../controllers/authController");
const router = express.Router();

// ⚠️ Removed unnecessary imports:
// const auth = require("../middlewares/authMiddleware"); 
// const { isAdmin } = require("../middlewares/roleMiddleware"); 
// const { getApprovalStatus } = require("../controllers/approvalController");

// --- Auth Endpoints ---

// POST /api/auth/signup (Public)
router.post("/signup", signup);

// POST /api/auth/login (Public)
router.post("/login", login);

module.exports = router;