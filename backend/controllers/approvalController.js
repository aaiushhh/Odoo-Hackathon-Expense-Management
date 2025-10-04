const ApprovalFlow = require('../models/ApprovalFlow');
const { Schema } = require('mongoose');
exports.getApprovalStatus = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const approvalFlow = await ApprovalFlow.findOne({ expense_id: expenseId });
    if (!approvalFlow) return res.status(404).json({ message: 'Approval flow not found' });
    res.json(approvalFlow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
