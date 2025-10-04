const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  employeeId: mongoose.Schema.Types.ObjectId,
  companyId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  currency: String,
  convertedAmount: Number,
  category: String,
  description: String,
  date: Date,
  receiptUrl: String,
  approvalFlowId: mongoose.Schema.Types.ObjectId,
  status: "PENDING" | "APPROVED" | "REJECTED" | "UNDER_REVIEW",
  approvalHistory: [
    {
      approverId: mongoose.Schema.Types.ObjectId,
      comment: String,
      decision: String
    },
  ],
});

const Company = mongoose.model("Company", companySchema);
module.exports = Company;
