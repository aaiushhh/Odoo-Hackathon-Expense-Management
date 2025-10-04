// controllers/expenseController.js
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const ApprovalFlow = require('../models/ApprovalFlow');
const Team = require('../models/Team');
const User = require('../models/User');
const Company = require('../models/Company');
const currencyConverter = require('../utils/currencyConverter');

// ======================================================
// 🧾 1. Submit New Expense (Employee)
// ======================================================
const submitExpense = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, currency, category, description, date, receiptUrl } = req.body;
    const user = req.user;

    // 1️⃣ Fetch company currency
    const company = await Company.findById(user.companyId).session(session);
    if (!company) throw new Error("Company not found.");
    const companyCurrency = company.currency || 'USD';

    // 2️⃣ Convert currency
    const convertedAmount = await currencyConverter.convert(currency, companyCurrency, amount);

    // 3️⃣ Create Expense
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

    // 4️⃣ Build Approval Flow dynamically
    const employee = await User.findById(user.userId).select('managerId').session(session);
    const managerId = employee?.managerId;

    const higherRoles = ['Manager', 'CFO', 'Director', 'Admin'];
    const approvers = await User.find({
      companyId: user.companyId,
      role: { $in: higherRoles }
    }).select('_id').session(session);

    const approverIds = approvers.map(u => u._id);
    let sequence = [];

    if (managerId) sequence.push(managerId);
    sequence = [...sequence, ...approverIds.filter(id => !managerId || id.toString() !== managerId.toString())];

    // 5️⃣ Create ApprovalFlow document
    const approvalFlow = new ApprovalFlow({
      expense_id: expense._id,
      companyId: user.companyId,
      steps: [
        { stepNumber: 1, role: managerId ? 'Manager' : 'CFO' },
        { stepNumber: 2, role: 'Admin' }
      ],
      sequence,
      required_approvers: [],
      percentage: 100,
      currentStep: 1,
      status: 'PENDING'
    });
    await approvalFlow.save({ session });

    // 6️⃣ Link approval flow to expense
    expense.approvalFlowId = approvalFlow._id;
    await expense.save({ session });

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
    next(err);
  }
};

// ======================================================
// 👤 2. Get My Expenses (Employee)
// ======================================================
const getMyExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ employeeId: req.user.userId })
      .populate('approvalFlowId')
      .sort({ date: -1 });

    res.json({ expenses });
  } catch (err) {
    next(err);
  }
};

// ======================================================
// 🔍 3. Get Expense by ID (Employee/Admin)
// ======================================================
const getExpenseById = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const user = req.user;

    const expense = await Expense.findById(expenseId).populate('approvalFlowId');
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    if (expense.employeeId.toString() !== user.userId.toString() && user.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden: You do not own this expense.' });
    }

    res.json({ expense, approvalFlow: expense.approvalFlowId });
  } catch (err) {
    next(err);
  }
};

// ======================================================
// ✅ 4. Get Pending Approvals (Manager/CFO/Admin)
// ======================================================
const getPendingApprovals = async (req, res, next) => {
  try {
    const user = req.user;

    // Find flows where user is part of approver sequence
    const potentialFlows = await ApprovalFlow.find({
      companyId: user.companyId,
      sequence: user.userId,
      status: { $in: ['PENDING', 'IN_PROGRESS'] }
    });

    const flowIds = potentialFlows.map(flow => flow._id);

    const expenses = await Expense.find({
      approvalFlowId: { $in: flowIds },
      status: { $in: ['PENDING', 'UNDER_REVIEW'] }
    })
      .populate('employeeId', 'name email')
      .populate({ path: 'approvalFlowId', select: 'sequence currentStep approvals' });

    // Filter out already approved by this user
    const expensesToApprove = expenses.filter(exp => {
      const flow = exp.approvalFlowId;
      if (!flow) return false;
      const userDecision = flow.approvals?.some(a => a.approverId.toString() === user.userId.toString());
      return !userDecision;
    });

    res.json({
      message: 'Pending approvals retrieved successfully',
      count: expensesToApprove.length,
      expenses: expensesToApprove
    });
  } catch (err) {
    next(err);
  }
};

// ======================================================
// 👥 5. Get Team Expenses (Manager)
// ======================================================
const getTeamExpenses = async (req, res, next) => {
  try {
    const user = req.user;
    const teams = await Team.find({ managerId: user.userId });

    if (!teams.length) {
      return res.status(404).json({ message: 'No teams found for this manager' });
    }

    const teamMemberIds = [...new Set(teams.flatMap(team => team.members.map(id => id.toString())))];

    const expenses = await Expense.find({
      employeeId: { $in: teamMemberIds },
      companyId: user.companyId
    }).populate('employeeId', 'name email');

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.convertedAmount, 0);

    res.json({
      message: 'Team expenses retrieved successfully',
      teams: teams.map(t => ({
        id: t._id,
        name: t.name,
        memberCount: t.members.length
      })),
      totalExpenses,
      expenses
    });
  } catch (err) {
    next(err);
  }
};

// ======================================================
// 👤 6. Get Team Expenses by Team ID (Manager)
// ======================================================
const getTeamExpensesById = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const user = req.user;

    const team = await Team.findOne({
      _id: teamId,
      managerId: user.userId,
      companyId: user.companyId
    });

    if (!team) {
      return res.status(403).json({ message: 'Forbidden: Team not found or you are not the assigned manager.' });
    }

    const expenses = await Expense.find({
      employeeId: { $in: team.members },
      companyId: user.companyId
    }).populate('employeeId', 'name email');

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.convertedAmount, 0);

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

// ======================================================
// 📦 Exports
// ======================================================
module.exports = {
  submitExpense,
  getMyExpenses,
  getExpenseById,
  getPendingApprovals,
  getTeamExpenses,
  getTeamExpensesById
};
