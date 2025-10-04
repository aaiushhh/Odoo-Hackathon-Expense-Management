const mongoose = require("mongoose");

const approvalFlowSchema = new mongoose.Schema({
  workflow_id: String,
  expense_id: mongoose.Schema.Types.ObjectId,
  companyId: mongoose.Schema.Types.ObjectId,
  steps: [{ stepNumber: Number, role: String }],
  sequence: [mongoose.Schema.Types.ObjectId], 
  required_approvers: [mongoose.Schema.Types.ObjectId],
  percentage: Number,
  currentStep: Number,
  approvals: [
    {
      approverId: mongoose.Schema.Types.ObjectId,
      decision: String,
      comment: String,
    },
  ],
  status: "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED",
});

const ApprovalFlow = mongoose.model("ApprovalFlow", approvalFlowSchema);
module.exports = ApprovalFlow;
