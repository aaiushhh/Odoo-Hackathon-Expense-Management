const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware'); 
const { 
    submitExpense, 
    getMyExpenses, 
    getPendingApprovals,
    getTeamExpenses, 
    getTeamExpensesById, 
    getExpenseById // Also ensure getExpenseById is here if you want it authenticated
} = require('../controllers/expenseController'); 

// Apply authentication middleware to the whole router to protect all routes by default
router.use(authenticateToken); // Assuming 'auth' is your authenticateToken middleware

// --- Expense Submission ---
// POST /api/expenses
router.post('/', submitExpense);

// --- Employee Views ---
// GET /api/expenses/mine
router.get('/mine', getMyExpenses); 
// GET /api/expenses/:expenseId
router.get('/:expenseId', getExpenseById);

// --- Manager/Approver Views ---
// GET /api/expenses/pending (Approver)
router.get('/pending', getPendingApprovals); 
// GET /api/expenses/team (Manager)
router.get('/team', getTeamExpenses); 
// GET /api/expenses/team/:teamId (Manager)
router.get('/team/:teamId', getTeamExpensesById); 


module.exports = router;