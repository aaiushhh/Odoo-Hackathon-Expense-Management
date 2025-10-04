const Expense = require("../models/Expense");
const ApprovalFlow = require("../models/ApprovalFlow");
const Team = require("../models/Team");
const User = require("../models/User");
const Company = require("../models/Company");
const currencyConverter = require("../utils/currencyConverter");
const mongoose = require("mongoose");

// ======================================================
// ✅ POST /api/expenses - Submit a New Expense
// ======================================================
const submitExpense = async (req, res, next) => {
  // Start a transaction for atomic operation (Expense + ApprovalFlow)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, currency, category, description, date, receiptUrl } =
      req.body;
    const user = req.user; // User object from JWT payload { userId, companyId, role }

    // 1. Fetch Company Data (for base currency)
    const company = await Company.findById(user.companyId).session(session);
    if (!company) throw new Error("Company not found.");
    const companyCurrency = company.currency;

    // 2. Currency Conversion
    const convertedAmount = await currencyConverter.convert(
      currency,
      companyCurrency,
      amount
    );

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
      status: "PENDING",
    });
    await expense.save({ session });

    // 4. Determine Dynamic Approval Flow (Placeholder Logic)
    const employeeRecord = await User.findById(user.userId)
      .select("managerId")
      .session(session);
    const managerId = employeeRecord?.managerId;

    const defaultApprovers = await User.find({
      companyId: user.companyId,
      role: { $in: ["Manager", "CFO", "Director", "Admin"] },
    })
      .select("_id")
      .session(session);

    const defaultApproverIds = defaultApprovers.map((u) => u._id);

    let sequence = [];
    if (managerId) {
      sequence.push(managerId);
    }
    sequence = [
      ...sequence,
      ...defaultApproverIds.filter(
        (id) => !managerId || id.toString() !== managerId.toString()
      ),
    ];

    // 5. Create ApprovalFlow Document
    const approvalFlow = new ApprovalFlow({
      expense_id: expense._id,
      companyId: user.companyId,
      steps: [{ stepNumber: 1, role: managerId ? "Manager" : "CFO" }],
      sequence: sequence,
      required_approvers: [],
      percentage: 60,
      currentStep: 1,
      status: "PENDING",
    });
    await approvalFlow.save({ session });

    // 6. Link ApprovalFlow to Expense
    expense.approvalFlowId = approvalFlow._id;
    await expense.save({ session });

    // 7. Commit Transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Expense submitted and approval flow initiated successfully",
      expense,
      approvalFlow,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// ======================================================
// ✅ GET /api/expenses/mine - Get My Expenses
// ======================================================
const getMyExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ employeeId: req.user.userId })
      .populate("approvalFlowId")
      .sort({ date: -1 });

    res.json({
      success: true,
      expenses,
    });
  } catch (err) {
    next(err);
  }
};

// ======================================================
// ✅ GET /api/expenses/:expenseId - Get a Single Expense
// ======================================================
const getExpenseById = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const user = req.user;

    const expense = await Expense.findById(expenseId).populate(
      "approvalFlowId"
    );

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    // Security check: Employee can only view their own expense unless they are an Admin or Manager
    if (
      expense.employeeId.toString() !== user.userId.toString() &&
      !["Admin", "Manager"].includes(user.role)
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, expense, approvalFlow: expense.approvalFlowId });
  } catch (err) {
    next(err);
  }
};

// ======================================================
// ✅ GET /api/expenses/pending - Get Pending Approvals
// ======================================================
const getPendingApprovals = async (req, res, next) => {
  try {
    const user = req.user;

    const potentialFlows = await ApprovalFlow.find({
      companyId: user.companyId,
      sequence: user.userId,
      status: { $in: ["PENDING", "IN_PROGRESS"] },
    });

    const pendingFlowIds = potentialFlows.map((flow) => flow._id);

    let pendingExpenses = await Expense.find({
      approvalFlowId: { $in: pendingFlowIds },
      status: { $in: ["PENDING", "UNDER_REVIEW"] },
    })
      .populate("employeeId", "name email")
      .populate({
        path: "approvalFlowId",
        select: "sequence currentStep approvals",
      });

    const expensesToApprove = pendingExpenses.filter((expense) => {
      const flow = expense.approvalFlowId;
      if (!flow) return false;

      const userDecision = flow.approvals.some(
        (a) => a.approverId.toString() === user.userId.toString()
      );

      return !userDecision;
    });

    res.json({
      message: "Pending approvals retrieved successfully.",
      count: expensesToApprove.length,
      expenses: expensesToApprove,
    });
  } catch (err) {
    next(err);
  }
};

// ======================================================
// ✅ GET /api/expenses/team - Get All Team Expenses
// ======================================================
const getTeamExpenses = async (req, res, next) => {
  try {
    const user = req.user;

    const teams = await Team.find({ managerId: user.userId });

    if (teams.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No teams found for this manager",
      });
    }

    const teamMemberIds = teams.flatMap((team) => team.members);

    const expenses = await Expense.find({
      employeeId: { $in: teamMemberIds },
      companyId: user.companyId,
    }).populate("employeeId", "name email");

    // ... (rest of the calculation and formatting logic) ...
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.convertedAmount,
      0
    );

    const expensesByStatus = expenses.reduce((acc, expense) => {
      if (!acc[expense.status]) {
        acc[expense.status] = [];
      }
      acc[expense.status].push(expense);
      return acc;
    }, {});

    const totalsByStatus = {};
    Object.keys(expensesByStatus).forEach((status) => {
      totalsByStatus[status] = expensesByStatus[status].reduce(
        (sum, expense) => sum + expense.convertedAmount,
        0
      );
    });

    res.json({
      success: true,
      message: "Team expenses retrieved successfully",
      teams: teams.map((team) => ({
        id: team._id,
        name: team.name,
        memberCount: team.members.length,
      })),
      totalExpenses,
      expensesByStatus,
      totalsByStatus,
      expenses,
    });
  } catch (err) {
    next(err);
  }
};

// ======================================================
// ✅ Exports
// ======================================================
module.exports = {
  submitExpense,
  getMyExpenses,
  getPendingApprovals,
  getExpenseById,
  getTeamExpenses,
};
