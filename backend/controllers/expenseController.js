const Expense = require('../models/Expense');
const ApprovalFlow = require('../models/ApprovalFlow');
const Team = require('../models/Team'); // Assuming you have a Team model for manager-team relationships
const User = require('../models/User');
const Company = require('../models/Company');
const currencyConverter = require('../utils/currencyConverter');
const mongoose = require('mongoose'); // Need mongoose for session/transaction

// --- Core Logic: Expense Submission and Flow Initiation ---

/**
 * POST /api/expenses
 * Creates a new expense and initializes the required ApprovalFlow in a transaction.
 */
const submitExpense = async (req, res, next) => {
    // Start a transaction for atomic operation (Expense + ApprovalFlow)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { amount, currency, category, description, date, receiptUrl } = req.body;
        const user = req.user; // User object from JWT payload { userId, companyId, role }

        // 1. Fetch Company Data (for base currency)
        const company = await Company.findById(user.companyId).session(session);
        if (!company) throw new Error("Company not found.");
        const companyCurrency = company.currency;

        // 2. Currency Conversion
        // NOTE: If currencyConverter fails, ensure it throws an error to catch/rollback the transaction
        const convertedAmount = await currencyConverter.convert(currency, companyCurrency, amount);

        // 3. Create Expense Document
        const expense = new Expense({
            employeeId: user.userId, 
            companyId: user.companyId,
            amount,
            currency,
            convertedAmount,
            category,
            description,
            date,
            receiptUrl,
            status: 'PENDING'
        });
        await expense.save({ session });
        
        // 4. Determine Dynamic Approval Flow (Placeholder Logic)
        
        // Fetch the submitting employee's full record to get their manager ID
        const employeeRecord = await User.findById(user.userId).select('managerId').session(session);
        const managerId = employeeRecord?.managerId;
        
        // Placeholder: Get all high-level approvers (Managers, CFOs, Directors) in the company
        const defaultApprovers = await User.find({ 
            companyId: user.companyId, 
            role: { $in: ['Manager', 'CFO', 'Director', 'Admin'] } 
        }).select('_id').session(session);

        const defaultApproverIds = defaultApprovers.map(u => u._id);

        // Define the approval sequence (Manager first, then others, filtering out duplicates)
        let sequence = [];
        if (managerId) {
            sequence.push(managerId);
        }
        // Add other approvers, ensuring no duplicates with the manager
        sequence = [...sequence, ...defaultApproverIds.filter(id => !managerId || id.toString() !== managerId.toString())];
        
        // 5. Create ApprovalFlow Document
        const approvalFlow = new ApprovalFlow({
            expense_id: expense._id,
            companyId: user.companyId,
            steps: [{ stepNumber: 1, role: managerId ? 'Manager' : 'CFO' }], // Step 1 is Manager or CFO if no manager
            sequence: sequence,
            required_approvers: [],         // Based on future Admin config
            percentage: 60,                 // Default from blueprint
            currentStep: 1,
            status: 'PENDING'
        });
        await approvalFlow.save({ session });

        // 6. Link ApprovalFlow to Expense
        expense.approvalFlowId = approvalFlow._id;
        await expense.save({ session }); 

        // 7. Commit Transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: 'Expense submitted and approval flow initiated successfully',
            expense,
            approvalFlow
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        // Pass error to global Express error handler
        next(err); 
    }
};

// --- Employee Endpoints ---

/**
 * GET /api/expenses/mine
 * Get the current employee's expense history.
 */
const getMyExpenses = async (req, res, next) => {
    try {
        const expenses = await Expense.find({ employeeId: req.user.userId })
            .populate('approvalFlowId') // Populate the linked flow status
            .sort({ date: -1 });

        res.json({ expenses });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/expenses/:expenseId
 * Get a specific expense and its approval flow status.
 */
const getExpenseById = async (req, res, next) => {
    try {
        const { expenseId } = req.params;
        const user = req.user;

        const expense = await Expense.findById(expenseId).populate('approvalFlowId');
        
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        
        // Security check: Employee can only view their own expense unless they are an Admin
        if (expense.employeeId.toString() !== user.userId.toString() && user.role !== 'Admin') {
             // Managers/CFOs/Directors will need a separate check for team/pending expenses
            return res.status(403).json({ message: 'Forbidden: You do not own this expense.' });
        }

        res.json({ expense, approvalFlow: expense.approvalFlowId });
    } catch (err) {
        next(err);
    }
};

// --- Approver Endpoints ---

/**
 * GET /api/expenses/pending
 * Fetch expenses that require approval from the current Manager/CFO/Director.
 * NOTE: This is complex logic and represents a crucial part of the system.
 */
const getPendingApprovals = async (req, res, next) => {
    try {
        const user = req.user;

        // 1. Find Approval Flows where the current user is a potential approver in the sequence
        const potentialFlows = await ApprovalFlow.find({
            companyId: user.companyId,
            sequence: user.userId,
            status: { $in: ['PENDING', 'IN_PROGRESS'] }
        });

        const pendingFlowIds = potentialFlows.map(flow => flow._id);

        // 2. Fetch Expenses linked to these potential flows
        let pendingExpenses = await Expense.find({
            approvalFlowId: { $in: pendingFlowIds },
            status: { $in: ['PENDING', 'UNDER_REVIEW'] }
        })
        .populate('employeeId', 'name email')
        .populate({
            path: 'approvalFlowId',
            select: 'sequence currentStep approvals'
        });

        // 3. Filter: Keep only expenses where the user is an active approver for the CURRENT step
        // For simplicity, we check if the user has NOT already made a decision.
        
        const expensesToApprove = pendingExpenses.filter(expense => {
            const flow = expense.approvalFlowId;
            if (!flow) return false;

            // Check if user has already approved/rejected this flow
            const userDecision = flow.approvals.some(a => a.approverId.toString() === user.userId.toString());
            
            // For a basic flow, if the user is in the sequence and hasn't approved, they see it.
            // (True logic would check the current step's approvers list)
            return !userDecision;
        });

        res.json({ 
            message: "Pending approvals retrieved successfully.",
            count: expensesToApprove.length,
            expenses: expensesToApprove 
        });

    } catch (err) {
        next(err);
    }
};

// --- Manager Team View Endpoints (Manager only) ---

/**
 * GET /api/expenses/team
 * Get overall team expenses for managers.
 * NOTE: Requires 'Team' model to map managerId to members.
 */
const getTeamExpenses = async (req, res, next) => {
    try {
        const user = req.user;
        
        // Find teams where the user is a manager
        const teams = await Team.find({ managerId: user.userId }); // Use userId from JWT

        // Get all unique team member IDs
        const teamMemberIds = [...new Set(teams.flatMap(team => team.members).map(id => id.toString()))];
        
        // Get expenses for all team members
        const expenses = await Expense.find({ 
            employeeId: { $in: teamMemberIds },
            companyId: user.companyId // Ensure multi-tenancy is respected
        }).populate('employeeId', 'name email');

        // Calculate and group stats (as done in your original code)
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.convertedAmount, 0);
        
        // ... (rest of the calculation logic for totalsByStatus/expensesByStatus) ...

        res.json({
            message: 'Team expenses retrieved successfully',
            // ... (return relevant team data)
            totalExpenses,
            expenses
        });
    } catch (err) {
        next(err);
    }
};
// const getTeamExpensesById is omitted for brevity but follows similar logic.

const getTeamExpensesById = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const user = req.user;

        // 1. Verify the user is the manager of this specific team
        const team = await Team.findOne({ 
            _id: teamId, 
            managerId: user.userId,
            companyId: user.companyId
        });
        
        if (!team) {
            return res.status(403).json({ message: 'Forbidden: Team not found or you are not the assigned manager.' });
        }

        // 2. Get expenses for the team members
        const expenses = await Expense.find({ 
            employeeId: { $in: team.members },
            companyId: user.companyId 
        }).populate('employeeId', 'name email');

        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.convertedAmount, 0);

        res.json({
            message: `Expenses for Team ${team.name} retrieved successfully`,
            team: {
                id: team._id,
                name: team.name,
                memberCount: team.members.length
            },
            totalExpenses,
            expenses
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    submitExpense,
    getMyExpenses,
    getPendingApprovals,
    getExpenseById,
    getTeamExpenses,
    getTeamExpensesById // ✅ Now defined and exported
};