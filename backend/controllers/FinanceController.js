const Expense = require('../models/Expense');
const { Roles } = require('../config/global');

// @desc    Raise expense request
// @route   POST /api/finance
// @access  Private (requires finance.create permission)
const createExpense = async (req, res) => {
  try {
    const expense = new Expense({
      ...req.body,
      requestedBy: req.user._id
    });
    const createdExpense = await expense.save();
    res.status(201).json(createdExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Approve/Reject expense
// @route   PUT /api/finance/:id/status
// @access  Private (requires finance.update permission)
const updateExpenseStatus = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (expense) {
      expense.status = req.body.status; // approved, rejected
      expense.rejectionReason = req.body.rejectionReason || '';
      expense.approvedBy = req.user._id;
      const updatedExpense = await expense.save();
      res.json(updatedExpense);
    } else {
      res.status(404).json({ message: 'Expense not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all expenses
// @route   GET /api/finance
// @access  Private (requires finance.read permission)
const getExpenses = async (req, res) => {
  try {
    // SUPER_ADMIN and any user with finance.read permission sees all expenses
    // (route-level permission check already guards this endpoint)
    const expenses = await Expense.find()
      .populate('requestedBy', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export expenses as CSV
// @route   GET /api/finance/export
// @access  Private
const exportExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate('requestedBy', 'name')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    let csv = 'Title,Amount,Project,Requested By,Status,Date\n';
    expenses.forEach(exp => {
      csv += `"${exp.title}",${exp.amount},"${exp.project?.name || 'N/A'}","${exp.requestedBy?.name || 'N/A'}",${exp.status},${exp.createdAt.toISOString().split('T')[0]}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createExpense,
  updateExpenseStatus,
  getExpenses,
  exportExpenses
};
