const ApprovalFlow = require("../models/ApprovalFlow");
const Expense = require("../models/Expense");

// ======================================================
// ✅ Get Approval Status for an Expense
// ======================================================
exports.getApprovalStatus = async (req, res) => {
  try {
    const { expenseId } = req.params;

    // First check if the expense exists and user has access
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // Check if user owns this expense or is authorized to view it (Admin/Manager)
    if (
      expense.employeeId.toString() !== req.user._id.toString() &&
      !["Admin", "Manager"].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Find the approval flow and populate the user details for the sequence and approvals
    const approvalFlow = await ApprovalFlow.findOne({ expense_id: expenseId })
      .populate("sequence", "name email role")
      .populate("approvals.approverId", "name email role");

    if (!approvalFlow) {
      return res.status(404).json({
        success: false,
        message: "Approval flow not found",
      });
    }

    // Format the response for a cleaner output
    const formattedApprovalFlow = {
      workflow_id: approvalFlow._id,
      expense_id: expenseId,
      steps: approvalFlow.steps,
      sequence: approvalFlow.sequence.map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      })),
      required_approvers: approvalFlow.required_approvers,
      percentage: approvalFlow.percentage,
      currentStep: approvalFlow.currentStep,
      status: approvalFlow.status,
      approvals: approvalFlow.approvals.map((approval) => ({
        approverId: approval.approverId._id,
        decision: approval.decision,
        comment: approval.comment,
        timestamp: approval.timestamp,
      })),
    };

    res.json({
      success: true,
      ...formattedApprovalFlow,
    });
  } catch (err) {
    console.error("Get Approval Status Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// ✅ Approve an Expense
// ======================================================
exports.approveExpense = async (req, res) => {
  try {
    const { workflowId } = req.params;

    const approvalFlow = await ApprovalFlow.findById(workflowId);
    if (!approvalFlow) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    // Set status to "Approved"
    approvalFlow.status = "Approved";
    approvalFlow.approvedBy = req.user.id;
    approvalFlow.approvedAt = new Date();

    await approvalFlow.save();
    res
      .status(200)
      .json({
        success: true,
        message: "Expense approved successfully",
        approvalFlow,
      });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// ✅ Reject an Expense
// ======================================================
exports.rejectExpense = async (req, res) => {
  try {
    const { workflowId } = req.params;

    const approvalFlow = await ApprovalFlow.findById(workflowId);
    if (!approvalFlow) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    // Set status to "Rejected"
    approvalFlow.status = "Rejected";
    approvalFlow.rejectedBy = req.user.id;
    approvalFlow.rejectedAt = new Date();

    await approvalFlow.save();
    res
      .status(200)
      .json({
        success: true,
        message: "Expense rejected successfully",
        approvalFlow,
      });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
