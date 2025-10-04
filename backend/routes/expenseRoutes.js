const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { createExpense, getMyExpenses, getExpenseById, getTeamExpenses, getTeamExpensesById } = require('../controllers/expenseController');

router.post('/', auth, createExpense);
router.get('/mine', auth, getMyExpenses);
router.get('/team', auth, getTeamExpenses); // Get all team expenses for manager
router.get('/team/:teamId', auth, getTeamExpensesById); // Get expenses for specific team
router.get('/:expenseId', auth, getExpenseById);

module.exports = router;
