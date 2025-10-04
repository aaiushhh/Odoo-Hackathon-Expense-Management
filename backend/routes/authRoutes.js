<<<<<<< HEAD
const express = require('express');
const { signup, login } = require('../controllers/authController');
const router = express.Router();

// POST /api/auth/signup → Create company + admin
router.post('/signup', signup);

// POST /api/auth/login → Login and get JWT
router.post('/login', login);
=======
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
>>>>>>> 763fc7dbfb2a8fa88285739a062288fa22ad2b2e

module.exports = router;
