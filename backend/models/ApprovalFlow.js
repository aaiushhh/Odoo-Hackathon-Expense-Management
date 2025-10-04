const mongoose = require("mongoose");
const { Schema } = require('mongoose'); // Add this line

const ApprovalFlowSchema = new Schema({
    // workflow_id is now the MongoDB _id
    expense_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'Expense', 
        required: true, 
        unique: true 
    },
    companyId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Company', 
        required: true 
    },
    steps: [
        { 
            stepNumber: { type: Number, required: true }, 
            role: { type: String, enum: ['Admin', 'Manager', 'Employee', 'CFO', 'Director'], required: true } 
        }
    ],
    sequence: [ 
        { type: Schema.Types.ObjectId, ref: 'User' } // Ordered list of approver IDs
    ],            
    required_approvers: [ 
        { type: Schema.Types.ObjectId, ref: 'User' } // Specific users who MUST approve
    ],  
    percentage: { 
        type: Number, 
        default: 100, 
        min: 0, 
        max: 100 
    }, // % approval threshold (e.g., 60)
    currentStep: { type: Number, default: 1 },
    approvals: [
        {
            approverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            decision: { type: String, enum: ['APPROVED', 'REJECTED'], required: true },
            comment: { type: String },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    status: {
        type: String,
        enum: ["PENDING", "IN_PROGRESS", "APPROVED", "REJECTED"],
        default: "PENDING"
    },
}, { timestamps: true });

const ApprovalFlow = mongoose.model("ApprovalFlow", ApprovalFlowSchema);
module.exports = ApprovalFlow;
