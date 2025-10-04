const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middlewares/authMiddleware');
const { 
  createEmployee,
  getProfile, 
  updateProfile,
  getCompanyEmployees 
} = require('../controllers/userController');

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/employees', authenticate, isAdmin, createEmployee); // Admin only
router.get('/employees', authenticate, getCompanyEmployees); // Admin/Manager

module.exports = router;