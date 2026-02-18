import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, AlertCircle, User, Calendar, Briefcase } from 'lucide-react';
import { usePendingTasks, useApproveTask, useRejectTask } from '../../hooks/useApi';

interface PendingTask {
    _id: string;
    title: string;
    description?: string;
    priority: string;
    createdBy: {
        _id: string;
        name: string;
        role: string;
    };
    project: {
        _id: string;
        name: string;
        clientName: string;
    };
    createdAt: string;
    dueDate?: string;
}

const PendingTasksPanel: React.FC = () => {
    const { data: pendingTasks, isLoading } = usePendingTasks();
    const approveTaskMutation = useApproveTask();
    const rejectTaskMutation = useRejectTask();

    const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleApprove = (taskId: string) => {
        approveTaskMutation.mutate(taskId);
    };

    const handleReject = (taskId: string) => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }
        rejectTaskMutation.mutate({ taskId, reason: rejectionReason }, {
            onSuccess: () => {
                setRejectingTaskId(null);
                setRejectionReason('');
            }
        });
    };

    const priorityColors: Record<string, string> = {
        LOW: 'bg-blue-100 text-blue-700',
        MEDIUM: 'bg-amber-100 text-amber-700',
        HIGH: 'bg-orange-100 text-orange-700',
        URGENT: 'bg-red-100 text-red-700',
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!pendingTasks || pendingTasks.length === 0) {
        return (
            <div className="bg-card rounded-2xl p-8 text-center border border-border">
                <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
                <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                <p className="text-secondary-500">No tasks pending approval</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Pending Approvals</h2>
                    <p className="text-secondary-500 mt-1">Review and approve tasks created by project managers</p>
                </div>
                <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-bold">
                    {pendingTasks.length} Pending
                </div>
            </div>

            <div className="space-y-3">
                {pendingTasks.map((task: PendingTask) => (
                    <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${priorityColors[task.priority] || 'bg-secondary-100 text-secondary-700'}`}>
                                        {task.priority}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700">
                                        ⏳ Pending Approval
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold mb-2">{task.title}</h3>

                                {task.description && (
                                    <p className="text-secondary-600 text-sm mb-3">{task.description}</p>
                                )}

                                <div className="flex flex-wrap gap-4 text-xs text-secondary-500">
                                    <div className="flex items-center gap-1">
                                        <Briefcase size={14} />
                                        <span>{task.project.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <User size={14} />
                                        <span>Created by {task.createdBy.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {task.dueDate && (
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => handleApprove(task._id)}
                                    disabled={approveTaskMutation.isPending}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-semibold"
                                >
                                    <CheckCircle size={16} />
                                    Approve
                                </button>
                                <button
                                    onClick={() => setRejectingTaskId(task._id)}
                                    disabled={rejectTaskMutation.isPending}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-semibold"
                                >
                                    <XCircle size={16} />
                                    Reject
                                </button>
                            </div>
                        </div>

                        {/* Rejection Modal */}
                        <AnimatePresence>
                            {rejectingTaskId === task._id && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 pt-4 border-t border-border"
                                >
                                    <label className="block text-sm font-medium mb-2">
                                        <AlertCircle className="inline mr-1" size={16} />
                                        Rejection Reason
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Explain why this task is being rejected..."
                                        className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                        rows={3}
                                    />
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleReject(task._id)}
                                            disabled={!rejectionReason.trim() || rejectTaskMutation.isPending}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-semibold"
                                        >
                                            {rejectTaskMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setRejectingTaskId(null);
                                                setRejectionReason('');
                                            }}
                                            className="px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors text-sm font-semibold"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default PendingTasksPanel;
