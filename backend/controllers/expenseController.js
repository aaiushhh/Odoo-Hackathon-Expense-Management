const Expense = require('../models/Expense');
const ApprovalFlow = require('../models/ApprovalFlow');
const Team = require('../models/Team');
const User = require('../models/User');
const Company = require('../models/Company');
const currencyConverter = require('../utils/currencyConverter');

// Create a new expense
exports.createExpense = async (req, res) => {
  try {
    const { amount, currency, category, description, date, receiptUrl } = req.body;

    // Get company currency from Company model
    const company = await Company.findById(req.user.companyId);
    const companyCurrency = company?.currency || 'USD';
    const convertedAmount = await currencyConverter.convert(currency, companyCurrency, amount);

    // Create the expense
    const expense = await Expense.create({
      employeeId: req.user._id,
      companyId: req.user.companyId,
      amount,
      currency,
      convertedAmount,
      category,
      description,
      date,
      receiptUrl,
      status: 'PENDING'
    });

    // Create approval flow for the expense
    const approvalFlow = await createApprovalFlow(expense._id, req.user.companyId);

    // Update expense with approval flow ID
    expense.approvalFlowId = approvalFlow._id;
    await expense.save();

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      expense: {
        expenseId: expense._id,
        status: expense.status,
        approvalFlowId: approvalFlow._id,
        convertedAmount: convertedAmount,
        companyCurrency: companyCurrency
      }
    });
  } catch (err) {
    console.error('Create Expense Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Helper function to create approval flow
async function createApprovalFlow(expenseId, companyId) {
  // Get company's default approval workflow
  // For now, create a simple workflow: Manager -> Admin
  const managers = await User.find({ 
    companyId: companyId, 
    role: 'Manager' 
  }).limit(1);
  
  const admins = await User.find({ 
    companyId: companyId, 
    role: 'Admin' 
  }).limit(1);

  const approvers = [...managers, ...admins];
  
  const approvalFlow = await ApprovalFlow.create({
    expense_id: expenseId,
    companyId: companyId,
    steps: [
      { stepNumber: 1, role: 'Manager' },
      { stepNumber: 2, role: 'Admin' }
    ],
    sequence: approvers.map(user => user._id),
    required_approvers: managers.map(user => user._id),
    percentage: 100,
    currentStep: 1,
    status: 'PENDING'
  });

  return approvalFlow;
}

exports.getMyExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ employeeId: req.user._id })
      .sort({ createdAt: -1 });

    const formattedExpenses = expenses.map(expense => ({
      expenseId: expense._id,
      amount: expense.amount,
      currency: expense.currency,
      convertedAmount: expense.convertedAmount,
      category: expense.category,
      description: expense.description,
      status: expense.status,
      date: expense.date,
      approvalFlowId: expense.approvalFlowId
    }));

    res.json({ 
      success: true,
      expenses: formattedExpenses 
    });
  } catch (err) {
    console.error('Get My Expenses Error:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const { expenseId } = req.params;
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

    const approvalFlow = await ApprovalFlow.findOne({ expense_id: expense._id })
      .populate('sequence', 'name email role')
      .populate('approvals.approverId', 'name email role');

    const formattedExpense = {
      expenseId: expense._id,
      amount: expense.amount,
      currency: expense.currency,
      convertedAmount: expense.convertedAmount,
      category: expense.category,
      description: expense.description,
      date: expense.date,
      status: expense.status,
      approvalFlowId: expense.approvalFlowId
    };

    const formattedApprovalFlow = approvalFlow ? {
      workflow_id: approvalFlow._id,
      expense_id: expense._id,
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
    } : null;

    res.json({ 
      success: true,
      expense: formattedExpense, 
      approvalFlow: formattedApprovalFlow 
    });
  } catch (err) {
    console.error('Get Expense Error:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Get overall team expenses (for managers)
exports.getTeamExpenses = async (req, res) => {
  try {
    const user = req.user;
    
    // Find teams where the user is a manager
    const teams = await Team.find({ managerId: user._id });
    
    if (teams.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No teams found for this manager' 
      });
    }

    // Get all team member IDs
    const teamMemberIds = teams.flatMap(team => team.members);
    
    // Get expenses for all team members
    const expenses = await Expense.find({ 
      employeeId: { $in: teamMemberIds } 
    }).populate('employeeId', 'name email');

    // Calculate total team expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.convertedAmount, 0);
    
    // Group expenses by status
    const expensesByStatus = expenses.reduce((acc, expense) => {
      if (!acc[expense.status]) {
        acc[expense.status] = [];
      }
      acc[expense.status].push(expense);
      return acc;
    }, {});

    // Calculate totals by status
    const totalsByStatus = {};
    Object.keys(expensesByStatus).forEach(status => {
      totalsByStatus[status] = expensesByStatus[status].reduce((sum, expense) => sum + expense.convertedAmount, 0);
    });

    res.json({
      success: true,
      message: 'Team expenses retrieved successfully',
      teams: teams.map(team => ({
        id: team._id,
        name: team.name,
        memberCount: team.members.length
      })),
      totalExpenses,
      expensesByStatus,
      totalsByStatus,
      expenses
    });
  } catch (err) {
    console.error('Get Team Expenses Error:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Get team expenses for a specific team
exports.getTeamExpensesById = async (req, res) => {
  try {
    const { teamId } = req.params;
    const user = req.user;

    // Verify the user is the manager of this team
    const team = await Team.findOne({ _id: teamId, managerId: user._id });
    if (!team) {
      return res.status(404).json({ 
        success: false,
        message: 'Team not found or you are not the manager' 
      });
    }

    // Get expenses for team members
    const expenses = await Expense.find({ 
      employeeId: { $in: team.members } 
    }).populate('employeeId', 'name email');

    // Calculate total team expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.convertedAmount, 0);
    
    // Group expenses by status
    const expensesByStatus = expenses.reduce((acc, expense) => {
      if (!acc[expense.status]) {
        acc[expense.status] = [];
      }
      acc[expense.status].push(expense);
      return acc;
    }, {});

    // Calculate totals by status
    const totalsByStatus = {};
    Object.keys(expensesByStatus).forEach(status => {
      totalsByStatus[status] = expensesByStatus[status].reduce((sum, expense) => sum + expense.convertedAmount, 0);
    });

    res.json({
      success: true,
      message: 'Team expenses retrieved successfully',
      team: {
        id: team._id,
        name: team.name,
        memberCount: team.members.length
      },
      totalExpenses,
      expensesByStatus,
      totalsByStatus,
      expenses
    });
  } catch (err) {
    console.error('Get Team Expenses Error:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};
