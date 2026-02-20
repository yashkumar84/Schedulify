import React from 'react';
import { useAdminAllTasks } from '../../hooks/useApi';
import {
    Loader2,
    User,
    Briefcase,
    AlertCircle,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

const statusColors: Record<string, string> = {
    'todo': 'bg-secondary-100 text-secondary-700 border-secondary-200',
    'in-progress': 'bg-blue-50 text-blue-700 border-blue-100',
    'review': 'bg-amber-50 text-amber-700 border-amber-100',
    'completed': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'on-hold': 'bg-red-50 text-red-700 border-red-100'
};

const priorityColors: Record<string, string> = {
    'low': 'text-emerald-600 bg-emerald-50',
    'medium': 'text-amber-600 bg-amber-50',
    'high': 'text-rose-600 bg-rose-50'
};

const GlobalTasksPage: React.FC = () => {
    const { data: tasks, isLoading, error } = useAdminAllTasks();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-900">Error Loading Tasks</h3>
                <p className="text-red-600">{(error as any).message}</p>
            </div>
        );
    }

    // Group tasks by project
    const groupedTasks = (tasks || []).reduce((acc: any, task: any) => {
        const projectName = task.project?.name || 'Unassigned Project';
        if (!acc[projectName]) {
            acc[projectName] = [];
        }
        acc[projectName].push(task);
        return acc;
    }, {});

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Global Tasks Overview</h1>
                    <p className="text-secondary-500 mt-1">Viewing all tasks across all projects</p>
                </div>
            </div>

            <div className="space-y-10">
                {Object.entries(groupedTasks).map(([projectName, projectTasks]: any, projectIdx) => (
                    <motion.div
                        key={projectName}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: projectIdx * 0.1 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-3 px-2">
                            <Briefcase className="w-5 h-5 text-primary-600" />
                            <h2 className="text-xl font-bold text-secondary-900">{projectName}</h2>
                            <span className="text-xs font-semibold bg-secondary-100 text-secondary-600 px-2 py-1 rounded-full">
                                {projectTasks.length} tasks
                            </span>
                        </div>

                        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-secondary-50/50 text-secondary-500 text-xs uppercase tracking-wider">
                                            <th className="px-6 py-4 font-semibold">Task Details</th>
                                            <th className="px-6 py-4 font-semibold text-center">Status</th>
                                            <th className="px-6 py-4 font-semibold">Assigned To</th>
                                            <th className="px-6 py-4 font-semibold">Priority</th>
                                            <th className="px-6 py-4 font-semibold text-right">Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {projectTasks.map((task: any) => (
                                            <tr key={task._id} className="hover:bg-secondary-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col min-w-[200px]">
                                                        <span className="font-bold text-secondary-900 group-hover:text-primary-600 transition-colors">
                                                            {task.title}
                                                        </span>
                                                        <span className="text-xs text-secondary-500 line-clamp-1 mt-0.5">
                                                            {task.description}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${statusColors[task.status] || statusColors['todo']}`}>
                                                            {task.status?.replace('-', ' ')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 text-xs font-bold border border-primary-100">
                                                            {task.assignedTo?.name?.charAt(0) || <User size={14} />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-secondary-900">{task.assignedTo?.name || 'Unassigned'}</span>
                                                            {task.assignedTo?.email && <span className="text-[10px] text-secondary-400">{task.assignedTo.email}</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${priorityColors[task.priority] || priorityColors['medium']}`}>
                                                        {task.priority || 'Medium'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-1.5 text-secondary-600 text-sm">
                                                            <Clock size={14} className="text-secondary-400" />
                                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                                                        </div>
                                                        {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                                                            <span className="text-[10px] text-rose-500 font-bold uppercase mt-1">Overdue</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {Object.keys(groupedTasks).length === 0 && (
                    <div className="p-20 text-center bg-card rounded-2xl border border-dashed border-border">
                        <CheckCircle2 className="w-16 h-16 text-secondary-100 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-secondary-900">No tasks found</h3>
                        <p className="text-secondary-500 max-w-xs mx-auto">There are no tasks available across any projects currently.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalTasksPage;
