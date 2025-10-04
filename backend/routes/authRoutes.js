const express = require("express");
const { signup, login } = require("../controllers/authController");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const { getApprovalStatus } = require("../controllers/approvalController");

router.get("/:expenseId", auth, getApprovalStatus);

// POST /api/auth/signup → Create company + admin
router.post("/signup", signup);

// POST /api/auth/login → Login and get JWT
router.post("/login", login);

module.exports = router;
