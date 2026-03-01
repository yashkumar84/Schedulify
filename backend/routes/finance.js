const express = require('express');
const router = express.Router();
const { createExpense, updateExpenseStatus, getExpenses } = require('../controllers/FinanceController');
const { authenticate, checkPermission } = require('../helpers/auth');

router.get('/', authenticate, checkPermission('finance', 'read'), getExpenses);
router.get('/export', authenticate, exportExpenses);
router.post('/', authenticate, createExpense); // Allowing any authenticated user to create expense
router.put('/:id/status', authenticate, checkPermission('finance', 'update'), updateExpenseStatus);

module.exports = router;
