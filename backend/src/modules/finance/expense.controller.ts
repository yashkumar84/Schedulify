import { Request, Response } from 'express';
import { ExpenseService } from './expense.service';

const expenseService = new ExpenseService();

export class ExpenseController {
    async getAllExpenses(req: Request, res: Response) {
        try {
            const expenses = await expenseService.getAllExpenses();
            res.json(expenses);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async createExpense(req: any, res: Response) {
        try {
            const expense = await expenseService.createExpense({ ...req.body, requestedBy: req.user.id });
            res.status(201).json(expense);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async approveExpense(req: any, res: Response) {
        try {
            const expense = await expenseService.approveExpense(req.params.id as string, req.user.id, req.body.comment);
            res.json(expense);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async rejectExpense(req: any, res: Response) {
        try {
            const expense = await expenseService.rejectExpense(req.params.id as string, req.user.id, req.body.comment);
            res.json(expense);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
