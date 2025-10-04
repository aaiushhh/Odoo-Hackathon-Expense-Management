<<<<<<< HEAD
const ApprovalFlow = require('../models/ApprovalFlow');
const Expense = require('../models/Expense');
=======
const ApprovalFlow = require("../models/ApprovalFlow");
>>>>>>> 763fc7dbfb2a8fa88285739a062288fa22ad2b2e

exports.getApprovalStatus = async (req, res) => {
  try {
    const { expenseId } = req.params;
<<<<<<< HEAD
    
    // First check if the expense exists and user has access
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ 
        success: false,
        message: 'Expense not found' 
      });
    }

    // Check if user owns this expense or is authorized to view it
    if (expense.employeeId.toString() !== req.user._id.toString() && 
        !['Admin', 'Manager'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    const approvalFlow = await ApprovalFlow.findOne({ expense_id: expenseId })
      .populate('sequence', 'name email role')
      .populate('approvals.approverId', 'name email role');

    if (!approvalFlow) {
      return res.status(404).json({ 
        success: false,
        message: 'Approval flow not found' 
      });
    }

    const formattedApprovalFlow = {
      workflow_id: approvalFlow._id,
      expense_id: expenseId,
      steps: approvalFlow.steps,
      sequence: approvalFlow.sequence.map(user => user._id),
      required_approvers: approvalFlow.required_approvers,
      percentage: approvalFlow.percentage,
      currentStep: approvalFlow.currentStep,
      status: approvalFlow.status,
      approvals: approvalFlow.approvals.map(approval => ({
        approverId: approval.approverId._id,
        decision: approval.decision,
        comment: approval.comment,
        timestamp: approval.timestamp
      }))
    };

    res.json({ 
      success: true,
      ...formattedApprovalFlow 
    });
=======
    const approvalFlow = await ApprovalFlow.findOne({ expense_id: expenseId });
    if (!approvalFlow)
      return res.status(404).json({ message: "Approval flow not found" });
    res.json(approvalFlow);
>>>>>>> 763fc7dbfb2a8fa88285739a062288fa22ad2b2e
  } catch (err) {
    console.error('Get Approval Status Error:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};
