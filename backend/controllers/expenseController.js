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

    // Get company currency from Company model instead of user
    const company = await Company.findById(req.user.companyId);
    const companyCurrency = company?.currency || 'USD';
    const convertedAmount = await currencyConverter.convert(currency, companyCurrency, amount);

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

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      expense
    });
  } catch (err) {
    console.error('Create Expense Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

exports.getMyExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ employeeId: req.user._id });
    res.json({ expenses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const approvalFlow = await ApprovalFlow.findOne({ expense_id: expense._id });
    res.json({ expense, approvalFlow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get overall team expenses (for managers)
exports.getTeamExpenses = async (req, res) => {
  try {
    const user = req.user;
    
    // Find teams where the user is a manager
    const teams = await Team.find({ managerId: user._id });
    
    if (teams.length === 0) {
      return res.status(404).json({ message: 'No teams found for this manager' });
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
    res.status(500).json({ message: err.message });
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
      return res.status(404).json({ message: 'Team not found or you are not the manager' });
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
    res.status(500).json({ message: err.message });
  }
};
