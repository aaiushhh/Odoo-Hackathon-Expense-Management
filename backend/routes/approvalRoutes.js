const express = require("express");
const router = express.Router();

// Required Imports
const { getApprovalStatus, approveExpense, rejectExpense } = require("../controllers/approvalController"); 
const { authenticateToken } = require("../middlewares/authMiddleware"); // JWT middleware
const { isAdmin, isManager } = require("../middlewares/roleMiddleware"); // Role-based checks
// ⚠️ Note: I'm assuming you'll name your JWT middleware 'authenticateToken'

// Apply Authentication to ALL routes in this file
router.use(authenticateToken); 

// --- Approval Flow Endpoints ---

// GET /api/approvalflow/:expenseId → Get workflow status (Accessible by Admin, Manager, Employee)
router.get("/:expenseId", getApprovalStatus);

// POST /api/approvalflow/:workflowId/approve → Approve expense (Accessible by Admin, Manager, CFO, Director)
// ⚠️ This requires a custom middleware to check if the user is a valid approver for this workflow step.
// For now, let's allow Admins/Managers to start testing.
router.post("/:workflowId/approve", isManager, approveExpense); // isManager here would ideally be a custom 'isApprover' check

// POST /api/approvalflow/:workflowId/reject → Reject expense
router.post("/:workflowId/reject", isManager, rejectExpense);

module.exports = router;