import mongoose, { Schema, Document } from 'mongoose';

import { ExpenseStatus } from '../../common/types/finance';

export interface IExpense extends Document {
    project: mongoose.Types.ObjectId;
    requestedBy: mongoose.Types.ObjectId;
    amount: number;
    description: string;
    invoiceUrl?: string;
    status: ExpenseStatus;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewComment?: string;
}

const ExpenseSchema: Schema = new Schema(
    {
        project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
        requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true },
        description: { type: String, required: true },
        invoiceUrl: { type: String },
        status: {
            type: String,
            enum: Object.values(ExpenseStatus),
            default: ExpenseStatus.PENDING
        },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reviewComment: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
