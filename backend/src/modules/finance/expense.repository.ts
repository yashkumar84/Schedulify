import Expense, { IExpense } from './expense.model';

export class ExpenseRepository {
    async findAll(): Promise<IExpense[]> {
        return Expense.find()
            .populate('project', 'name clientName')
            .populate('requestedBy', 'name email')
            .populate('reviewedBy', 'name email');
    }

    async findByProject(projectId: string): Promise<IExpense[]> {
        return Expense.find({ project: projectId }).populate('requestedBy', 'name email');
    }

    async findById(id: string): Promise<IExpense | null> {
        return Expense.findById(id).populate('requestedBy', 'name email').populate('project', 'name');
    }

    async create(expenseData: Partial<IExpense>): Promise<IExpense> {
        const expense = new Expense(expenseData);
        return expense.save();
    }

    async updateStatus(id: string, status: string, reviewedBy: string, reviewComment?: string) {
        return Expense.findByIdAndUpdate(
            id,
            { status, reviewedBy, reviewComment },
            { new: true }
        );
    }
}
