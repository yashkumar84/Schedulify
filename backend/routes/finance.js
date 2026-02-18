const express = require('express');
const router = express.Router();
const { createExpense, updateExpenseStatus, getExpenses } = require('../controllers/FinanceController');
const { authenticate, authorize } = require('../helpers/auth');
const { Roles } = require('../config/global');

router.get('/', authenticate, getExpenses);
router.post('/', authenticate, createExpense);
router.put('/:id/status', authenticate, authorize(Roles.FINANCE_TEAM, Roles.SUPER_ADMIN), updateExpenseStatus);

module.exports = router;
