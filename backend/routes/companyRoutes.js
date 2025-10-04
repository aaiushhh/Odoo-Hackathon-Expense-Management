const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middlewares/authMiddleware');
const { 
  getCompany, 
  updateCompany 
} = require('../controllers/companyController');

router.get('/', authenticate, getCompany);
router.put('/', authenticate, isAdmin, updateCompany); // Admin only

module.exports = router;