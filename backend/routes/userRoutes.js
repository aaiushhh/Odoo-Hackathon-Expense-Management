const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middlewares/authMiddleware');
const { 
  createEmployee,
  getProfile, 
  updateProfile,
  getCompanyEmployees,
  updateEmployee,
  sendPasswordReset
} = require('../controllers/userController');

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/employees', authenticate, isAdmin, createEmployee);
router.get('/employees', authenticate, getCompanyEmployees);
router.put('/employees/:userId', authenticate, isAdmin, updateEmployee);
router.post('/employees/:userId/reset-password', authenticate, isAdmin, sendPasswordReset);

module.exports = router;