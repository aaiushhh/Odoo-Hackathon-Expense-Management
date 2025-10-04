// routes/expenseRoutes.js
const express = require('express');
const router = express.Router();

// Controllers
const {
  submitExpense,
  createExpense,
  getMyExpenses,
  getPendingApprovals,
  getTeamExpenses,
  getTeamExpensesById,
  getExpenseById
} = require('../controllers/expenseController');

// Middleware
const { authenticateToken } = require('../middlewares/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * -------------------------
 * Expense Submission
 * -------------------------
 */

// POST /api/expenses - submit a new expense
router.post('/', submitExpense); 
// Optional: If using legacy 'createExpense' method, can alias
router.post('/create', createExpense);

/**
 * -------------------------
 * Employee Views
 * -------------------------
 */

// GET /api/expenses/mine - get current user's expenses
router.get('/mine', getMyExpenses);

// GET /api/expenses/:expenseId - get specific expense
router.get('/:expenseId', getExpenseById);

/**
 * -------------------------
 * Manager / Approver Views
 * -------------------------
 */

// GET /api/expenses/pending - get pending approvals for approvers
router.get('/pending', getPendingApprovals);

// GET /api/expenses/team - get all team expenses for manager
router.get('/team', getTeamExpenses);

// GET /api/expenses/team/:teamId - get expenses for a specific team
router.get('/team/:teamId', getTeamExpensesById);

module.exports = router;
