import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Calendar,
    DollarSign,
    Users,
    CheckCircle2,
    Clock,
    AlertCircle,
    Plus,
    Briefcase,
    Trash2,
    X,
    MessageCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useProjectDetail, useProjectTasks, useUpdateProject, useDeleteProject, useCreateTask, useDeleteTask, useTeam } from '../../hooks/useApi';
import { Loader2 } from 'lucide-react';
import { ProjectStatus } from '../../../../backend/src/common/types/project';
import { useForm, Controller } from 'react-hook-form';
import CustomSelect from '../../components/ui/CustomSelect';
import ActionMenu, { ActionMenuItem } from '../../components/ui/ActionMenu';
import { TaskPriority } from '../../../../backend/src/common/types/task';
import { useAuthStore } from '../../store/authStore';
import ChatPanel from '../../components/chat/ChatPanel';
import { initializeSocket } from '../../utils/socket';

const ProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { data: project, isLoading: isProjectLoading } = useProjectDetail(id!);
    const { data: tasks, isLoading: isTasksLoading } = useProjectTasks(id!);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Initialize Socket.io connection
    useEffect(() => {
        initializeSocket();
    }, []);

    const { data: teamMembers } = useTeam();
    const updateProjectMutation = useUpdateProject();
    const deleteProjectMutation = useDeleteProject();
    const createTaskMutation = useCreateTask();
    const deleteTaskMutation = useDeleteTask();

    const editForm = useForm();
    const taskForm = useForm();

    const handleEditProject = () => {
        editForm.setValue('name', project.name);
        editForm.setValue('clientName', project.clientName);
        editForm.setValue('description', project.description);
        editForm.setValue('budget', project.budget);
        editForm.setValue('startDate', new Date(project.startDate).toISOString().split('T')[0]);
        editForm.setValue('endDate', new Date(project.endDate).toISOString().split('T')[0]);
        editForm.setValue('status', project.status);
        setIsEditModalOpen(true);
    };

    const onEditSubmit = (data: any) => {
        updateProjectMutation.mutate({ projectId: id!, data }, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                editForm.reset();
            }
        });
    };

    const handleDeleteProject = () => {
        if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            deleteProjectMutation.mutate(id!, {
                onSuccess: () => {
                    navigate('/projects');
                }
            });
        }
    };

    const onNewTaskSubmit = (data: any) => {
        const currentUser = user as any;
        createTaskMutation.mutate({
            ...data,
            project: id,
            assignedTo: currentUser?.id || currentUser?._id,
        }, {
            onSuccess: () => {
                setIsNewTaskModalOpen(false);
                taskForm.reset();
            }
        });
    };

    const handleTaskAction = (taskId: string, action: string) => {
        if (action === 'delete') {
            if (window.confirm('Are you sure you want to delete this task?')) {
                deleteTaskMutation.mutate(taskId);
            }
        }
    };

    if (isProjectLoading || isTasksLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                <p className="mt-4 text-secondary-500 font-medium">Loading project details...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-secondary-900">Project not found</h2>
                <button
                    onClick={() => navigate('/projects')}
                    className="mt-4 text-primary-600 font-semibold hover:underline"
                >
                    Back to projects
                </button>
            </div>
        );
    }

    const taskStats = {
        total: tasks?.length || 0,
        completed: tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0,
        inProgress: tasks?.filter((t: any) => t.status === 'IN_PROGRESS').length || 0,
        todo: tasks?.filter((t: any) => t.status === 'TODO').length || 0
    };

    const progress = taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;

    const statusOptions = [
        { id: ProjectStatus.NOT_STARTED, label: 'Not Started', icon: Clock, color: 'text-secondary-600', bg: 'bg-secondary-50' },
        { id: ProjectStatus.IN_PROGRESS, label: 'In Progress', icon: AlertCircle, color: 'text-primary-600', bg: 'bg-primary-50' },
        { id: ProjectStatus.ON_HOLD, label: 'On Hold', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: ProjectStatus.COMPLETED, label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    const priorityOptions = [
        { id: TaskPriority.LOW, label: 'Low', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: TaskPriority.MEDIUM, label: 'Medium', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: TaskPriority.HIGH, label: 'High', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: TaskPriority.URGENT, label: 'Urgent', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <button
                        onClick={() => navigate('/projects')}
                        className="flex items-center gap-1 text-secondary-500 hover:text-primary-600 transition-colors text-sm font-medium mb-2"
                    >
                        <ChevronLeft size={16} /> Back to Projects
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">{project.name}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${project.status === ProjectStatus.IN_PROGRESS ? 'bg-primary-100 text-primary-600' :
                            project.status === ProjectStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' :
                                'bg-secondary-100 text-secondary-600'
                            }`}>
                            {project.status}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className="px-5 py-2.5 bg-card border border-border rounded-xl font-semibold hover:bg-secondary-50 transition-colors text-sm flex items-center gap-2"
                    >
                        <MessageCircle size={18} />
                        Chat
                    </button>
                    <button
                        onClick={handleEditProject}
                        className="px-5 py-2.5 bg-card border border-border rounded-xl font-semibold hover:bg-secondary-50 transition-colors text-sm"
                    >
                        Edit Project
                    </button>
                    <button
                        onClick={() => setIsNewTaskModalOpen(true)}
                        className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 text-sm flex items-center gap-2"
                    >
                        <Plus size={18} /> New Task
                    </button>
                </div>
            </div>

            {/* Project Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-secondary-500">
                        <Calendar size={20} />
                        <span className="text-sm font-bold uppercase tracking-wider">Timeline</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-secondary-500">Started:</span>
                            <span className="font-semibold">{new Date(project.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-secondary-500">Deadline:</span>
                            <span className="font-semibold text-rose-600">{new Date(project.endDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-secondary-500">
                        <DollarSign size={20} />
                        <span className="text-sm font-bold uppercase tracking-wider">Budget</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-bold">${project.budget?.toLocaleString()}</h3>
                        <p className="text-xs text-secondary-500">Total estimated budget</p>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-secondary-500">
                        <Briefcase size={20} />
                        <span className="text-sm font-bold uppercase tracking-wider">Project Lead</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                            {project.manager?.name?.charAt(0) || 'M'}
                        </div>
                        <div>
                            <p className="text-sm font-bold">{project.manager?.name || 'Assigned Lead'}</p>
                            <p className="text-xs text-secondary-500">{project.manager?.role?.replace('_', ' ') || 'Manager'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Members & Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Members Section */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold">Team Members</h3>
                            <p className="text-sm text-secondary-500 mt-1">People working on this project</p>
                        </div>
                        <span className="bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-xs font-bold">
                            {(() => {
                                // Get unique team members from tasks + manager
                                const uniqueMembers = new Set();
                                if (project.manager?._id) uniqueMembers.add(project.manager._id);
                                tasks?.forEach((task: any) => {
                                    if (task.assignedTo?._id) uniqueMembers.add(task.assignedTo._id);
                                });
                                return uniqueMembers.size;
                            })()} Members
                        </span>
                    </div>
                    <div className="space-y-3">
                        {/* Show Project Manager first */}
                        {project.manager && (
                            <div className="flex items-center justify-between p-3 bg-secondary-50/50 rounded-xl hover:bg-secondary-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                        {project.manager.name?.charAt(0) || 'M'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{project.manager.name}</p>
                                        <p className="text-xs text-secondary-500">{project.manager.email}</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-600">
                                    PROJECT MANAGER
                                </span>
                            </div>
                        )}

                        {/* Show unique team members from tasks */}
                        {(() => {
                            const uniqueMembers = new Map();
                            tasks?.forEach((task: any) => {
                                if (task.assignedTo?._id && task.assignedTo._id !== project.manager?._id) {
                                    uniqueMembers.set(task.assignedTo._id, task.assignedTo);
                                }
                            });
                            return Array.from(uniqueMembers.values()).map((member: any) => (
                                <div key={member._id} className="flex items-center justify-between p-3 bg-secondary-50/50 rounded-xl hover:bg-secondary-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                            {member.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{member.name}</p>
                                            <p className="text-xs text-secondary-500">{member.email}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${member.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-600' :
                                        member.role === 'ADMIN' ? 'bg-blue-100 text-blue-600' :
                                            member.role === 'MANAGER' ? 'bg-emerald-100 text-emerald-600' :
                                                'bg-secondary-100 text-secondary-600'
                                        }`}>
                                        {member.role?.replace('_', ' ')}
                                    </span>
                                </div>
                            ));
                        })()}

                        {(!project.manager && (!tasks || tasks.length === 0)) && (
                            <p className="text-center text-secondary-500 italic py-8">No team members assigned yet</p>
                        )}
                    </div>
                </div>

                {/* Activity Timeline Section */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold">Activity Timeline</h3>
                        <p className="text-sm text-secondary-500 mt-1">Recent project updates</p>
                    </div>
                    <div className="space-y-4">
                        {/* Activity items - using task data as activity */}
                        {tasks?.slice(0, 5).map((task: any, index: number) => (
                            <div key={task._id} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                                        task.status === 'IN_PROGRESS' ? 'bg-primary-100 text-primary-600' :
                                            'bg-secondary-100 text-secondary-600'
                                        }`}>
                                        {task.status === 'COMPLETED' ? <CheckCircle2 size={14} /> :
                                            task.status === 'IN_PROGRESS' ? <Clock size={14} /> :
                                                <AlertCircle size={14} />}
                                    </div>
                                    {index < Math.min(tasks.length - 1, 4) && (
                                        <div className="w-0.5 h-full bg-secondary-200 mt-1"></div>
                                    )}
                                </div>
                                <div className="flex-1 pb-4">
                                    <p className="text-sm font-semibold">{task.title}</p>
                                    <p className="text-xs text-secondary-500 mt-1">
                                        {task.status === 'COMPLETED' ? 'Completed' :
                                            task.status === 'IN_PROGRESS' ? 'In Progress' :
                                                'Created'} by {task.assignedTo?.name || 'Team'}
                                    </p>
                                    <p className="text-xs text-secondary-400 mt-1">
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!tasks || tasks.length === 0) && (
                            <p className="text-center text-secondary-500 italic py-8">No recent activity</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Tasks Section */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold">Project Tasks</h3>
                        <p className="text-sm text-secondary-500 mt-1">Manage deliverables and milestones</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest">Progress</p>
                            <p className="text-sm font-bold text-primary-600">{Math.round(progress)}%</p>
                        </div>
                        <div className="w-32 h-2 bg-secondary-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-primary-600"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary-50 text-secondary-600 text-xs font-bold uppercase tracking-wider">
                                <th className="py-4 px-6">Task Name</th>
                                <th className="py-4 px-6">Assignee</th>
                                <th className="py-4 px-6">Priority</th>
                                <th className="py-4 px-6">Status</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tasks?.map((task: any) => {
                                const menuItems: ActionMenuItem[] = [
                                    { id: 'delete', label: 'Delete Task', icon: Trash2, onClick: () => handleTaskAction(task._id, 'delete'), destructive: true },
                                ];

                                return (
                                    <tr key={task._id} className="hover:bg-secondary-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <p className="font-bold text-foreground">{task.title}</p>
                                            <p className="text-xs text-secondary-500">{task.description?.substring(0, 50)}{task.description?.length > 50 ? '...' : ''}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-secondary-200 text-[10px] font-bold flex items-center justify-center">
                                                    {task.assignedTo?.name?.charAt(0) || '?'}
                                                </div>
                                                <span className="text-xs font-medium text-secondary-700">{task.assignedTo?.name || 'Unassigned'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' :
                                                task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${task.status === 'COMPLETED' ? 'text-emerald-600' :
                                                task.status === 'IN_PROGRESS' ? 'text-primary-600' :
                                                    'text-secondary-500'
                                                }`}>
                                                {task.status === 'COMPLETED' ? <CheckCircle2 size={14} /> :
                                                    task.status === 'IN_PROGRESS' ? <Clock size={14} /> :
                                                        <AlertCircle size={14} />}
                                                {task.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <ActionMenu items={menuItems} />
                                        </td>
                                    </tr>
                                );
                            })}
                            {tasks?.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-secondary-500 italic">
                                        No tasks found for this project.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Project Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border p-8 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Edit Project</h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-secondary-400 hover:text-secondary-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Project Name</label>
                                    <input
                                        {...editForm.register('name', { required: true })}
                                        className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Client Name</label>
                                    <input
                                        {...editForm.register('clientName')}
                                        className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    {...editForm.register('description')}
                                    className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Budget ($)</label>
                                    <input
                                        {...editForm.register('budget', { valueAsNumber: true })}
                                        type="number"
                                        className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <Controller
                                        name="status"
                                        control={editForm.control}
                                        render={({ field }) => (
                                            <CustomSelect
                                                options={statusOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Date</label>
                                    <input
                                        {...editForm.register('startDate')}
                                        type="date"
                                        className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">End Date</label>
                                    <input
                                        {...editForm.register('endDate')}
                                        type="date"
                                        className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 py-2 rounded-xl font-semibold hover:bg-secondary-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteProject}
                                    className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
                                >
                                    Delete Project
                                </button>
                                <button
                                    disabled={updateProjectMutation.isPending}
                                    className="bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center gap-2"
                                >
                                    {updateProjectMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* New Task Modal */}
            {isNewTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-8"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Create New Task</h2>
                            <button
                                onClick={() => setIsNewTaskModalOpen(false)}
                                className="text-secondary-400 hover:text-secondary-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={taskForm.handleSubmit(onNewTaskSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Task Title</label>
                                <input
                                    {...taskForm.register('title', { required: true })}
                                    className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="e.g. Design Homepage"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    {...taskForm.register('description')}
                                    className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                                    placeholder="Task details..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Priority</label>
                                <Controller
                                    name="priority"
                                    control={taskForm.control}
                                    defaultValue={TaskPriority.MEDIUM}
                                    render={({ field }) => (
                                        <CustomSelect
                                            options={priorityOptions}
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Due Date</label>
                                <input
                                    {...taskForm.register('dueDate', { required: true })}
                                    type="date"
                                    className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Assign To</label>
                                <Controller
                                    name="assignedTo"
                                    control={taskForm.control}
                                    render={({ field }) => (
                                        <CustomSelect
                                            options={teamMembers?.map((member: any) => ({
                                                id: member._id,
                                                label: member.name,
                                                icon: Users,
                                                color: 'text-primary-600',
                                                bg: 'bg-primary-50'
                                            })) || []}
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsNewTaskModalOpen(false)}
                                    className="px-6 py-2 rounded-xl font-semibold hover:bg-secondary-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={createTaskMutation.isPending}
                                    className="bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center gap-2"
                                >
                                    {createTaskMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Chat Panel */}
            <ChatPanel
                projectId={id!}
                projectName={project.name}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
        </div>
    );
};

export default ProjectDetailPage;
