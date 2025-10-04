const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { createExpense, getMyExpenses, getExpenseById, getTeamExpenses, getTeamExpensesById } = require('../controllers/expenseController');

router.post('/', authenticate, createExpense);
router.get('/mine', authenticate, getMyExpenses);
router.get('/team', authenticate, getTeamExpenses); // Get all team expenses for manager
router.get('/team/:teamId', authenticate, getTeamExpensesById); // Get expenses for specific team
router.get('/:expenseId', authenticate, getExpenseById);

module.exports = router;
