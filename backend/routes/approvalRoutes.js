// approvalRoutes.js - CORRECT ORDER
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { 
  getApprovalStatus, 
  getPendingExpenses, 
  makeApprovalDecision 
} = require('../controllers/approvalController');

// Specific routes FIRST
router.get('/pending/all', authenticate, getPendingExpenses);

// Dynamic routes AFTER
router.get('/:expenseId', authenticate, getApprovalStatus);
router.post('/:expenseId/decision', authenticate, makeApprovalDecision);

module.exports = router;