const Expense = require('../models/Expense');
const { Roles } = require('../config/global');

// @desc    Raise expense request
// @route   POST /api/finance
// @access  Private
const createExpense = async (req, res) => {
    try {
        const expense = new Expense({
            ...req.body,
            requestedBy: req.user._id,
        });
        const createdExpense = await expense.save();
        res.status(201).json(createdExpense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Approve/Reject expense
// @route   PUT /api/finance/:id/status
// @access  Private (Finance Team, Super Admin)
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

// @desc    Get all expenses (Filtered by role)
// @route   GET /api/finance
// @access  Private
const getExpenses = async (req, res) => {
    try {
        let query = {};

        // Non-admins can only see their own requests or projects they manage
        if (req.user.role === Roles.INHOUSE_TEAM || req.user.role === Roles.OUTSOURCED_TEAM) {
            query = { requestedBy: req.user._id };
        }

        const expenses = await Expense.find(query)
            .populate('requestedBy', 'name email')
            .populate('project', 'name')
            .sort({ createdAt: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createExpense,
    updateExpenseStatus,
    getExpenses,
};
