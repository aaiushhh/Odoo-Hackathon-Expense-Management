const mongoose = require("mongoose");
const { Schema } = mongoose;
const ExpenseSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, required: true, uppercase: true },
    convertedAmount: { type: Number, required: true, min: 0 }, // Converted to company's base currency
    category: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date, required: true },
    receiptUrl: { type: String, default: null }, // Link to stored receipt file
    approvalFlowId: {
      type: Schema.Types.ObjectId,
      ref: "ApprovalFlow",
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "UNDER_REVIEW"],
      default: "PENDING",
    },
    approvalHistory: [
      {
        approverId: { type: Schema.Types.ObjectId, ref: "User" },
        comment: { type: String },
        decision: { type: String, enum: ["APPROVED", "REJECTED", "OVERRIDE"] },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", ExpenseSchema);
module.exports = Expense;
