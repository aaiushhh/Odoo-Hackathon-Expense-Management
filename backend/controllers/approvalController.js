const ApprovalFlow = require("../models/ApprovalFlow");

exports.getApprovalStatus = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const approvalFlow = await ApprovalFlow.findOne({ expense_id: expenseId });
    if (!approvalFlow)
      return res.status(404).json({ message: "Approval flow not found" });
    res.json(approvalFlow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.approveExpense = async (req, res) => {
  try {
    const { workflowId } = req.params;

    const approvalFlow = await ApprovalFlow.findById(workflowId);
    if (!approvalFlow) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    approvalFlow.status = "Approved";
    approvalFlow.approvedBy = req.user.id;
    approvalFlow.approvedAt = new Date();

    await approvalFlow.save();
    res.status(200).json({ success: true, message: "Expense approved successfully", approvalFlow });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectExpense = async (req, res) => {
  try {
    const { workflowId } = req.params;

    const approvalFlow = await ApprovalFlow.findById(workflowId);
    if (!approvalFlow) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    approvalFlow.status = "Rejected";
    approvalFlow.rejectedBy = req.user.id;
    approvalFlow.rejectedAt = new Date();

    await approvalFlow.save();
    res.status(200).json({ success: true, message: "Expense rejected successfully", approvalFlow });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
