const express = require('express');
const { getUsers, createUser, updateUser, sendPassword } = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { authenticate, isAdmin } = require('../middlewares/authMiddleware');
const { 
  getCompany, 
  updateCompany 
} = require('../controllers/companyController');

const router = express.Router();

// All Company routes require authentication and Admin role
router.use(authenticateToken);
router.use(authorizeRoles(['Admin']));

// Fetch all users & Create new user
router.route('/users')
    .get(getUsers) // GET /api/company/users
    .post(createUser); // POST /api/company/users

// Update user role/manager
router.route('/users/:id')
    .put(updateUser); // PUT /api/company/users/:id

// Send/Reset Password
router.route('/users/:id/reset-password')
    .post(sendPassword); // POST /api/company/users/:id/reset-password


router.get('/', authenticate, getCompany);
router.put('/', authenticate, isAdmin, updateCompany); // Admin only

module.exports = router;