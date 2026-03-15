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

    let csv = 'Date,Title,Amount (₹),Project,Requested By,Invoice URL\n';
    expenses.forEach(exp => {
      csv += `${exp.createdAt.toISOString().split('T')[0]},"${exp.title}",${exp.amount},"${exp.project?.name || 'N/A'}","${exp.requestedBy?.name || 'N/A'}","${exp.invoiceUrl || 'No Invoice'}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update expense
// @route   PUT /api/finance/:id
// @access  Private (requires finance.update permission or being the requester)
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Allow update if user is the requester OR has finance.update permission OR is super admin
    const isOwner = expense.requestedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === Roles.SUPER_ADMIN;
    const hasUpdatePermission = req.user.permissions?.finance?.update === true;

    if (!isOwner && !isAdmin && !hasUpdatePermission) {
      return res.status(403).json({ message: 'Not authorized to update this expense' });
    }

    // Only allow updating if status is pending (unless SuperAdmin)
    if (expense.status !== 'pending' && !isAdmin) {
      return res.status(400).json({ message: 'Cannot update an expense that is already processed' });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/finance/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const isOwner = expense.requestedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === Roles.SUPER_ADMIN;
    const hasDeletePermission = req.user.permissions?.finance?.delete === true;

    if (!isOwner && !isAdmin && !hasDeletePermission) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createExpense,
  updateExpenseStatus,
  getExpenses,
  exportExpenses,
  updateExpense,
  deleteExpense
};
