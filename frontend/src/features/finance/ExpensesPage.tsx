import React, { useState } from 'react';
import { ExpenseStatus } from '../../../../backend/src/common/types/finance';
import {
    DollarSign,
    FileText,
    Clock,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useExpenses, useCreateExpense, useProjects } from '../../hooks/useApi';
import { Loader2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import CustomSelect from '../../components/ui/CustomSelect';
import { useDebounce } from '../../hooks/useDebounce';
import ActionMenu, { ActionMenuItem } from '../../components/ui/ActionMenu';
import { useAuthStore } from '../../store/authStore';

const ExpenseCard: React.FC<{ expense: any; index: number; onEdit: (expense: any) => void; onApprove: (id: string) => void; onReject: (id: string) => void }> = ({ expense, index, onEdit, onApprove, onReject }) => {
    const menuItems: ActionMenuItem[] = [
        { id: 'edit', label: 'Edit', icon: Edit2, onClick: () => onEdit(expense) },
        { id: 'approve', label: 'Approve', icon: CheckCircle, onClick: () => onApprove(expense._id) },
        { id: 'reject', label: 'Reject', icon: XCircle, onClick: () => onReject(expense._id), destructive: true },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${expense.status === ExpenseStatus.APPROVED ? 'bg-emerald-50 text-emerald-600' :
                    expense.status === ExpenseStatus.REJECTED ? 'bg-red-50 text-red-600' :
                        'bg-amber-50 text-amber-600'
                    }`}>
                    <DollarSign size={24} />
                </div>
                <div className="flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${expense.status === ExpenseStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                        expense.status === ExpenseStatus.REJECTED ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                        }`}>
                        {expense.status.toUpperCase()}
                    </div>
                    <ActionMenu items={menuItems} />
                </div>
            </div>

            <h4 className="font-bold text-lg mb-1 group-hover:text-primary-600 transition-colors">{expense.description}</h4>
            <p className="text-secondary-500 text-sm mb-4">Project: <span className="text-secondary-900 font-medium">{expense.project?.name || 'N/A'}</span></p>

            <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                    <p className="text-xs text-secondary-500 mb-1">Requested Amount</p>
                    <p className="text-xl font-bold">${expense.amount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-secondary-500 mb-1 text-right flex items-center justify-end gap-1">
                        <Clock size={12} /> {new Date(expense.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    {expense.invoiceUrl && (
                        <button className="text-primary-600 text-xs font-bold flex items-center gap-1 hover:underline">
                            <FileText size={14} /> Receipt
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const ExpensesPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const { user } = useAuthStore();

    const { data: expenses, isLoading } = useExpenses();
    const { data: projects } = useProjects();
    const createExpenseMutation = useCreateExpense();
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

    const onSubmit = (data: any) => {
        const currentUser = user as any;
        const payload = {
            ...data,
            requestedBy: currentUser?.id || currentUser?._id,
        };

        createExpenseMutation.mutate(payload, {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
            onError: (err: any) => {
                alert(`Error: ${err.response?.data?.message || err.message || 'Unknown error'}`);
            }
        });
    };

    const handleEdit = (expense: any) => {
        console.log('Editing expense:', expense);
        // TODO: Implement edit functionality
    };

    const handleApprove = (expenseId: string) => {
        console.log('Approving expense:', expenseId);
        // TODO: Implement approve functionality
    };

    const handleReject = (expenseId: string) => {
        console.log('Rejecting expense:', expenseId);
        // TODO: Implement reject functionality
    };

    const filteredExpenses = expenses?.filter((e: any) => {
        const query = debouncedSearch.toLowerCase();
        const matchesSearch = e.description?.toLowerCase().includes(query) ||
            e.project?.name?.toLowerCase().includes(query);
        const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                <p className="text-secondary-500 font-medium tracking-wide">Loading expenses...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Expenses</h1>
                    <p className="text-secondary-500 mt-1">Track and approve project-related expenses.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all"
                >
                    <Plus size={20} />
                    New Expense
                </button>
            </div>

            <div className="grid grid-cols-1 md:flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by description or project..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-card border border-border focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl transition-all outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-4 py-3 border rounded-xl text-sm font-semibold transition-colors ${statusFilter === 'ALL' ? 'bg-primary-600 text-white border-primary-600' : 'bg-card border-border hover:bg-secondary-50'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setStatusFilter(ExpenseStatus.PENDING)}
                        className={`px-4 py-3 border rounded-xl text-sm font-semibold transition-colors ${statusFilter === ExpenseStatus.PENDING ? 'bg-amber-600 text-white border-amber-600' : 'bg-card border-border hover:bg-secondary-50'}`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setStatusFilter(ExpenseStatus.APPROVED)}
                        className={`px-4 py-3 border rounded-xl text-sm font-semibold transition-colors ${statusFilter === ExpenseStatus.APPROVED ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card border-border hover:bg-secondary-50'}`}
                    >
                        Approved
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExpenses?.map((expense: any, index: number) => (
                    <ExpenseCard
                        key={expense._id}
                        expense={expense}
                        index={index}
                        onEdit={handleEdit}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                ))}
                {filteredExpenses?.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-card rounded-2xl border-2 border-dashed border-border text-secondary-500">
                        No expenses found.
                    </div>
                )}
            </div>

            {/* Create Expense Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-8"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Create New Expense</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-secondary-400 hover:text-secondary-600 transition-colors"
                            >
                                <Trash2 size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <input
                                    {...register('description', { required: 'Description is required' })}
                                    className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="e.g. Office supplies"
                                />
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description?.message as string}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Project</label>
                                <Controller
                                    name="project"
                                    control={control}
                                    rules={{ required: 'Project is required' }}
                                    render={({ field }) => (
                                        <CustomSelect
                                            options={projects?.map((p: any) => ({
                                                id: p._id || p.id,
                                                label: p.name,
                                                icon: DollarSign,
                                                color: 'text-blue-600',
                                                bg: 'bg-blue-50'
                                            })) || []}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select project..."
                                            searchable={true}
                                        />
                                    )}
                                />
                                {errors.project && <p className="text-red-500 text-xs mt-1">{errors.project?.message as string}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Amount ($)</label>
                                <input
                                    {...register('amount', { valueAsNumber: true, required: 'Amount is required' })}
                                    type="number"
                                    className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="500"
                                />
                                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount?.message as string}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Invoice URL (Optional)</label>
                                <input
                                    {...register('invoiceUrl')}
                                    type="url"
                                    className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2 rounded-xl font-semibold hover:bg-secondary-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={createExpenseMutation.isPending}
                                    className="bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center gap-2"
                                >
                                    {createExpenseMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Create Expense'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ExpensesPage;
