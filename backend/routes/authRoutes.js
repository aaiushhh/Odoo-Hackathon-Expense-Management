const express = require('express');
const { signup, login } = require('../controllers/authController');
const router = express.Router();

// POST /api/auth/signup → Create company + admin
router.post('/signup', signup);

// POST /api/auth/login → Login and get JWT
router.post('/login', login);

module.exports = router;