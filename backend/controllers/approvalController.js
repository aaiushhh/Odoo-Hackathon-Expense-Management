const ApprovalFlow = require("../models/ApprovalFlow");
const Expense = require("../models/Expense");
const User = require("../models/User");

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

    // Check if user owns this expense or is authorized to view it
    if (
      expense.employeeId.toString() !== req.user._id.toString() &&
      !["Admin", "Manager"].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const approvalFlow = await ApprovalFlow.findOne({ expense_id: expenseId })
      .populate("sequence", "name email role")
      .populate("approvals.approverId", "name email role");

    if (!approvalFlow) {
      return res.status(404).json({
        success: false,
        message: "Approval flow not found",
      });
    }

    const formattedApprovalFlow = {
      workflow_id: approvalFlow._id,
      expense_id: expenseId,
      steps: approvalFlow.steps,
      sequence: approvalFlow.sequence.map((user) => user._id),
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

// Get pending expenses for managers/admins
exports.getPendingExpenses = async (req, res) => {
  try {
    const user = req.user;

    // Only managers and admins can access this endpoint
    if (!["Manager", "Admin"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Manager or Admin role required.",
      });
    }

    // Get all pending approval flows for the user's company
    const approvalFlows = await ApprovalFlow.find({
      companyId: user.companyId,
      status: { $in: ["PENDING", "IN_PROGRESS"] },
    })
      .populate("expense_id")
      .populate("sequence", "name email role")
      .populate("approvals.approverId", "name email role")
      .sort({ createdAt: -1 });

    // Filter to only show expenses that need this user's approval
    const pendingForUser = approvalFlows.filter((flow) => {
      // Check if current user is in the sequence and hasn't approved yet
      const userInSequence = flow.sequence.some(
        (approver) => approver._id.toString() === user._id.toString()
      );

      if (!userInSequence) return false;

      // Check if user has already approved
      const userApproved = flow.approvals.some(
        (approval) => approval.approverId._id.toString() === user._id.toString()
      );

      return !userApproved;
    });

    // Format the response
    const formattedExpenses = pendingForUser.map((flow) => {
      const expense = flow.expense_id;
      return {
        expenseId: expense._id,
        amount: expense.amount,
        currency: expense.currency,
        convertedAmount: expense.convertedAmount,
        category: expense.category,
        description: expense.description,
        date: expense.date,
        receiptUrl: expense.receiptUrl,
        status: expense.status,
        employeeId: expense.employeeId,
        approvalFlowId: flow._id,
        currentStep: flow.currentStep,
        totalSteps: flow.steps.length,
        submittedAt: expense.createdAt,
        approvalFlow: {
          workflow_id: flow._id,
          status: flow.status,
          currentStep: flow.currentStep,
          approvals: flow.approvals.map((approval) => ({
            approverId: approval.approverId._id,
            approverName: approval.approverId.name,
            approverRole: approval.approverId.role,
            decision: approval.decision,
            comment: approval.comment,
            timestamp: approval.timestamp,
          })),
        },
      };
    });

    res.json({
      success: true,
      expenses: formattedExpenses,
    });
  } catch (err) {
    console.error("Get Pending Expenses Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Approve or reject an expense
exports.makeApprovalDecision = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { decision, comment } = req.body;
    const user = req.user;

    // Validate decision
    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision. Must be APPROVED or REJECTED.",
      });
    }

    // Only managers and admins can approve
    if (!["Manager", "Admin"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Manager or Admin role required.",
      });
    }

    // Find the expense and approval flow
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const approvalFlow = await ApprovalFlow.findOne({
      expense_id: expenseId,
    }).populate("sequence", "name email role");

    if (!approvalFlow) {
      return res.status(404).json({
        success: false,
        message: "Approval flow not found",
      });
    }

    // Check if user is authorized to approve this expense
    const userInSequence = approvalFlow.sequence.some(
      (approver) => approver._id.toString() === user._id.toString()
    );

    if (!userInSequence) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to approve this expense",
      });
    }

    // Check if user has already approved
    const userApproved = approvalFlow.approvals.some(
      (approval) => approval.approverId.toString() === user._id.toString()
    );

    if (userApproved) {
      return res.status(400).json({
        success: false,
        message: "You have already made a decision on this expense",
      });
    }

    // Add the approval decision
    approvalFlow.approvals.push({
      approverId: user._id,
      decision: decision,
      comment: comment || "",
      timestamp: new Date(),
    });

    // Update approval flow status
    if (decision === "REJECTED") {
      approvalFlow.status = "REJECTED";
      expense.status = "REJECTED";
    } else {
      // Check if this was the last required approval
      const requiredApprovers = approvalFlow.required_approvers.length;
      const approvalsCount = approvalFlow.approvals.filter(
        (a) => a.decision === "APPROVED"
      ).length;

      if (approvalsCount >= requiredApprovers) {
        approvalFlow.status = "APPROVED";
        expense.status = "APPROVED";
      } else {
        approvalFlow.status = "IN_PROGRESS";
        approvalFlow.currentStep += 1;
      }
    }

    // Save changes
    await approvalFlow.save();
    await expense.save();

    // Add to expense approval history
    expense.approvalHistory.push({
      approverId: user._id,
      decision: decision,
      comment: comment || "",
      timestamp: new Date(),
    });

    await expense.save();

    res.json({
      success: true,
      message: `Expense ${decision.toLowerCase()} successfully`,
      approvalFlow: {
        workflow_id: approvalFlow._id,
        status: approvalFlow.status,
        currentStep: approvalFlow.currentStep,
        approvals: approvalFlow.approvals,
      },
    });
  } catch (err) {
    console.error("Make Approval Decision Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
