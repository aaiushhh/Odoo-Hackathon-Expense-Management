const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");

// Import all necessary controller functions
const {
  submitExpense,
  getMyExpenses,
  getExpenseById,
  getPendingApprovals,
  getTeamExpenses,
  getTeamExpensesById,
} = require("../controllers/expenseController");

// Apply authentication middleware to all routes in this file
router.use(authenticateToken);

// --- Expense Submission ---
// POST /api/expenses
router.post("/", submitExpense);

// --- Employee Views ---
// GET /api/expenses/mine
router.get("/mine", getMyExpenses);

// GET /api/expenses/:expenseId
router.get("/:expenseId", getExpenseById);

// --- Manager/Approver Views ---
// GET /api/expenses/pending (Approver)
router.get("/pending", getPendingApprovals);

// GET /api/expenses/team (Manager)
router.get("/team", getTeamExpenses);

// GET /api/expenses/team/:teamId (Manager)
router.get("/team/:teamId", getTeamExpensesById);

module.exports = router;
