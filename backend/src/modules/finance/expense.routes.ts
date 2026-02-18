import { Router } from 'express';
import { ExpenseController } from './expense.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';
import { UserRole } from '../../common/types/user';

const router = Router();
const expenseController = new ExpenseController();

router.use(authenticate);

router.get('/', authorize([UserRole.SUPER_ADMIN, UserRole.FINANCE_TEAM]), expenseController.getAllExpenses);
router.post('/', expenseController.createExpense);
router.put('/:id/approve', authorize([UserRole.SUPER_ADMIN, UserRole.FINANCE_TEAM, UserRole.PROJECT_MANAGER]), expenseController.approveExpense);
router.put('/:id/reject', authorize([UserRole.SUPER_ADMIN, UserRole.FINANCE_TEAM, UserRole.PROJECT_MANAGER]), expenseController.rejectExpense);

export default router;
