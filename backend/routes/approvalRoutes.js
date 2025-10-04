const express = require("express");
const router = express.Router();

// Required Imports
const {
  getApprovalStatus,
  approveExpense,
  rejectExpense,
} = require("../controllers/approvalController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { isManager } = require("../middlewares/roleMiddleware");

// Apply Authentication to ALL routes in this file
router.use(authenticateToken);

// --- Approval Flow Endpoints ---

// GET /api/approvalflow/:expenseId -> Get workflow status (Accessible by all)
router.get("/:expenseId", getApprovalStatus);

// POST /api/approvalflow/:workflowId/approve -> Approve expense (Accessible by Admin, Manager, CFO, Director)
router.post("/:workflowId/approve", isManager, approveExpense);

// POST /api/approvalflow/:workflowId/reject -> Reject expense
router.post("/:workflowId/reject", isManager, rejectExpense);

module.exports = router;
