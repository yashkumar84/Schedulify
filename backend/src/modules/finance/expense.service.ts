import { ExpenseRepository } from './expense.repository';
import { IExpense } from './expense.model';
import { EmailService } from '../../common/utils/email.service';

const expenseRepository = new ExpenseRepository();
const emailService = new EmailService();

export class ExpenseService {
    async getAllExpenses() {
        return expenseRepository.findAll();
    }

    async getExpensesByProject(projectId: string) {
        return expenseRepository.findByProject(projectId);
    }

    async createExpense(expenseData: Partial<IExpense>) {
        return expenseRepository.create(expenseData);
    }

    async approveExpense(id: string, reviewerId: string, comment?: string) {
        const expense = await expenseRepository.updateStatus(id, 'Approved', reviewerId, comment);
        // Notify requester
        if (expense && expense.requestedBy) {
            const populatedExpense = await expenseRepository.findById(expense._id.toString());
            if (populatedExpense && populatedExpense.requestedBy) {
                const user = populatedExpense.requestedBy as any;
                emailService.sendExpenseStatusEmail(
                    user.email,
                    populatedExpense.description,
                    'Approved',
                    comment
                ).catch(err => console.error('Email trigger failed:', err));
            }
        }
        return expense;
    }

    async rejectExpense(id: string, reviewerId: string, comment: string) {
        const expense = await expenseRepository.updateStatus(id, 'Rejected', reviewerId, comment);
        // Notify requester
        if (expense && expense.requestedBy) {
            const populatedExpense = await expenseRepository.findById(expense._id.toString());
            if (populatedExpense && populatedExpense.requestedBy) {
                const user = populatedExpense.requestedBy as any;
                emailService.sendExpenseStatusEmail(
                    user.email,
                    populatedExpense.description,
                    'Rejected',
                    comment
                ).catch(err => console.error('Email trigger failed:', err));
            }
        }
        return expense;
    }
}
