import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Calendar,
    IndianRupee,
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
import { motion, AnimatePresence } from 'framer-motion';
import {
    useProjectDetail,
    useProjectTasks,
    useUpdateProject,
    useDeleteProject,
    useCreateTask,
    useDeleteTask,
    useTeam,
    useActivities
} from '../../hooks/useApi';
import { Loader2 } from 'lucide-react';
import ProjectTimeline from './ProjectTimeline';
import { useForm, Controller } from 'react-hook-form';
import CustomSelect from '../../components/ui/CustomSelect';
import MultiSelect from '../../components/ui/MultiSelect';
import ActionMenu, { ActionMenuItem } from '../../components/ui/ActionMenu';
import { useAuthStore } from '../../store/authStore';
import ChatPanel from '../../components/chat/ChatPanel';
import { initializeSocket } from '../../utils/socket';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import ActivityFeed from '../../components/ActivityFeed';
import Toast from '../../components/ui/Toast';

// Local definitions for project types
export enum ProjectStatus {
    NOT_STARTED = 'Not Started',
    IN_PROGRESS = 'In Progress',
    ON_HOLD = 'On Hold',
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled'
}

export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent'
}

const ProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { data: project, isLoading: isProjectLoading } = useProjectDetail(id!);
    const { data: tasks, isLoading: isTasksLoading } = useProjectTasks(id!);
    const { data: activities, isLoading: activitiesLoading } = useActivities(id);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'timeline'>('overview');

    // Initialize Socket.io connection
    useEffect(() => {
        initializeSocket();
    }, []);

    const { data: teamMembers } = useTeam();
    const updateProjectMutation = useUpdateProject();

    const [deleteConfirm, setDeleteConfirm] = useState<{
        isOpen: boolean;
        type: 'project' | 'task' | null;
        id: string | null;
    }>({
        isOpen: false,
        type: null,
        id: null
    });
    const deleteProjectMutation = useDeleteProject();
    const createTaskMutation = useCreateTask();
    const deleteTaskMutation = useDeleteTask();

    const editForm = useForm();
    const taskForm = useForm();
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const handleEditProject = () => {
        if (!project) return;

        const formatDate = (dateStr: any) => {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
            } catch (e) {
                return '';
            }
        };

        editForm.reset({
            name: project.name,
            clientName: project.clientName,
            description: project.description,
            budget: project.budget,
            startDate: formatDate(project.startDate),
            endDate: formatDate(project.endDate),
            status: project.status,
            collaborators: project.collaborators?.map((c: any) => c.id || c._id || c) || []
        });
        setIsEditModalOpen(true);
    };

    const onEditSubmit = (data: any) => {
        updateProjectMutation.mutate({ projectId: id!, data }, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                editForm.reset();
                setNotification({ message: 'Project details updated successfully!', type: 'success' });
            },
            onError: (error: any) => {
                console.error('Update failed:', error);
                setNotification({ message: error.response?.data?.message || 'Failed to update project. Please try again.', type: 'error' });
            }
        });
    };

    const handleDeleteProject = () => {
        setDeleteConfirm({ isOpen: true, type: 'project', id: id! });
    };

    const confirmDelete = () => {
        if (!deleteConfirm.id) return;

        if (deleteConfirm.type === 'project') {
            deleteProjectMutation.mutate(deleteConfirm.id, {
                onSuccess: () => {
                    navigate('/projects');
                }
            });
        } else if (deleteConfirm.type === 'task') {
            deleteTaskMutation.mutate(deleteConfirm.id, {
                onSuccess: () => {
                    setDeleteConfirm({ isOpen: false, type: null, id: null });
                }
            });
        }
    };

    const onNewTaskSubmit = (data: any) => {
        createTaskMutation.mutate({
            ...data,
            project: id,
        }, {
            onSuccess: () => {
                setIsNewTaskModalOpen(false);
                taskForm.reset();
            }
        });
    };

    const handleTaskAction = (taskId: string, action: string) => {
        if (action === 'delete') {
            setDeleteConfirm({ isOpen: true, type: 'task', id: taskId });
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
        completed: tasks?.filter((t: any) => t.status === 'completed').length || 0,
        inProgress: tasks?.filter((t: any) => t.status === 'in-progress').length || 0,
        todo: tasks?.filter((t: any) => t.status === 'todo').length || 0
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
                    {(user?.role !== 'OUTSOURCED_TEAM') && (
                        <>
                            {(user?.role === 'SUPER_ADMIN' || user?.role === 'PROJECT_MANAGER') && (
                                <button
                                    onClick={handleEditProject}
                                    className="px-5 py-2.5 bg-card border border-border rounded-xl font-semibold hover:bg-secondary-50 transition-colors text-sm"
                                >
                                    Edit Project
                                </button>
                            )}
                            <button
                                onClick={() => setIsNewTaskModalOpen(true)}
                                className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 text-sm flex items-center gap-2"
                            >
                                <Plus size={18} /> New Task
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-border mb-6">
                {[
                    { id: 'overview', label: 'Overview', icon: Briefcase },
                    { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
                    { id: 'timeline', label: 'Timeline', icon: Calendar },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeTab === tab.id
                            ? 'text-primary-600'
                            : 'text-secondary-500 hover:text-secondary-700'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-t-full"
                            />
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* Project Overview Cards */}
                    <div className={`grid grid-cols-1 ${user?.role === 'SUPER_ADMIN' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
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

                        {user?.role === 'SUPER_ADMIN' && (
                            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                                <div className="flex items-center gap-3 mb-4 text-secondary-500">
                                    <IndianRupee size={20} />
                                    <span className="text-sm font-bold uppercase tracking-wider">Budget</span>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-bold">₹{project.budget?.toLocaleString('en-IN')}</h3>
                                    <p className="text-xs text-secondary-500">Total estimated budget</p>
                                </div>
                            </div>
                        )}

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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold">Team Members</h3>
                                    <p className="text-sm text-secondary-500 mt-1">People working on this project</p>
                                </div>
                                <span className="bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-xs font-bold">
                                    {(project.manager ? 1 : 0) + (project.collaborators?.length || 0)} Members
                                </span>
                            </div>
                            <div className="space-y-3">
                                {project.manager && (
                                    <div className="flex items-center justify-between p-3 bg-secondary-50/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                                {project.manager.name?.charAt(0) || 'M'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{project.manager.name}</p>
                                                <p className="text-xs text-secondary-500">{project.manager.email}</p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-600 uppercase">
                                            Manager
                                        </span>
                                    </div>
                                )}
                                {project.collaborators?.map((member: any) => (
                                    <div key={member.id || member._id} className="flex items-center justify-between p-3 bg-white border border-border rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 font-bold">
                                                {member.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{member.name}</p>
                                                <p className="text-xs text-secondary-500">{member.email}</p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-100 text-secondary-600">
                                            {member.role?.replace('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                            <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
                            <div className="max-h-[400px] overflow-y-auto hide-scrollbar px-1">
                                <ActivityFeed activities={activities || []} isLoading={activitiesLoading} />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'tasks' && (
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold">Task Management</h3>
                            <p className="text-sm text-secondary-500 mt-1">Review, track and manage deliverables</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest">Overall Progress</p>
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
                                    <th className="py-4 px-6">Status & Approval</th>
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
                                                <p className="text-xs text-secondary-500">{task.description?.substring(0, 50)}</p>
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
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${['high', 'urgent', 'HIGH', 'URGENT'].includes(task.priority) ? 'bg-rose-100 text-rose-700' :
                                                    ['medium', 'MEDIUM'].includes(task.priority) ? 'bg-amber-100 text-amber-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {task.priority?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${['completed', 'COMPLETED'].includes(task.status) ? 'text-emerald-600' :
                                                        ['in-progress', 'IN_PROGRESS'].includes(task.status) ? 'text-primary-600' :
                                                            'text-secondary-500'
                                                        }`}>
                                                        {['completed', 'COMPLETED'].includes(task.status) ? <CheckCircle2 size={14} /> :
                                                            ['in-progress', 'IN_PROGRESS'].includes(task.status) ? <Clock size={14} /> :
                                                                <AlertCircle size={14} />}
                                                        {task.status?.replace('-', ' ')?.replace('_', ' ')}
                                                    </span>
                                                    {task.approvalStatus === 'pending' && (
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-tighter text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 w-fit">
                                                            <Clock size={10} /> Pending Approval
                                                        </span>
                                                    )}
                                                    {task.approvalStatus === 'rejected' && (
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-tighter text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 w-fit">
                                                            <X size={10} /> Rejected
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {(user?.role === 'SUPER_ADMIN' || user?.role === 'PROJECT_MANAGER') && (
                                                    <ActionMenu items={menuItems} />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {tasks?.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-secondary-500 italic">No tasks found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'timeline' && (
                <ProjectTimeline tasks={tasks || []} />
            )}

            {/* Modals section */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border p-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Edit Project</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-secondary-400 hover:text-secondary-600 transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Project Name</label>
                                    <input {...editForm.register('name', { required: true })} className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Client Name</label>
                                    <input {...editForm.register('clientName')} className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea {...editForm.register('description')} className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {user?.role === 'SUPER_ADMIN' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Budget (₹)</label>
                                        <input {...editForm.register('budget', { valueAsNumber: true })} type="number" className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <Controller name="status" control={editForm.control} render={({ field }) => (
                                        <CustomSelect options={statusOptions} value={field.value} onChange={field.onChange} />
                                    )} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Date</label>
                                    <input {...editForm.register('startDate')} type="date" className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">End Date</label>
                                    <input {...editForm.register('endDate')} type="date" className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 uppercase tracking-widest text-[11px] text-secondary-500 font-bold">Collaborators</label>
                                <Controller
                                    name="collaborators"
                                    control={editForm.control}
                                    render={({ field }) => (
                                        <MultiSelect
                                            options={teamMembers?.filter((m: any) => m.role !== 'SUPER_ADMIN' && m.role !== 'PROJECT_MANAGER').map((m: any) => ({
                                                id: m.id || m._id,
                                                label: m.name,
                                                icon: Users,
                                                color: 'text-primary-600',
                                                bg: 'bg-primary-50'
                                            })) || []}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Update team members..."
                                        />
                                    )}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-2 rounded-xl font-semibold hover:bg-secondary-100 transition-colors">Cancel</button>
                                <button type="button" onClick={handleDeleteProject} className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all">Delete Project</button>
                                <button disabled={updateProjectMutation.isPending} className="bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center gap-2">
                                    {updateProjectMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {isNewTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Create New Task</h2>
                            <button onClick={() => setIsNewTaskModalOpen(false)} className="text-secondary-400 hover:text-secondary-600 transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={taskForm.handleSubmit(onNewTaskSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Task Title</label>
                                <input {...taskForm.register('title', { required: true })} className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. Design Homepage" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea {...taskForm.register('description')} className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]" placeholder="Task details..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Priority</label>
                                    <Controller name="priority" control={taskForm.control} defaultValue={TaskPriority.MEDIUM} render={({ field }) => (
                                        <CustomSelect options={priorityOptions} value={field.value} onChange={field.onChange} />
                                    )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Start Date</label>
                                        <input {...taskForm.register('startDate', { required: true })} type="date" className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Due Date</label>
                                        <input {...taskForm.register('dueDate', { required: true })} type="date" className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Assign To</label>
                                <Controller name="assignedTo" control={taskForm.control} render={({ field }) => (
                                    <CustomSelect options={teamMembers?.map((member: any) => ({
                                        id: member._id,
                                        label: member.name,
                                        icon: Users,
                                        color: 'text-primary-600',
                                        bg: 'bg-primary-50'
                                    })) || []} value={field.value} onChange={field.onChange} />
                                )} />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setIsNewTaskModalOpen(false)} className="px-6 py-2 rounded-xl font-semibold hover:bg-secondary-100 transition-colors">Cancel</button>
                                <button disabled={createTaskMutation.isPending} className="bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center gap-2">
                                    {createTaskMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            <ChatPanel projectId={id!} projectName={project.name} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, type: null, id: null })}
                onConfirm={confirmDelete}
                title={`Delete ${deleteConfirm.type === 'project' ? 'Project' : 'Task'}`}
                message={`Are you sure you want to delete this ${deleteConfirm.type}? ${deleteConfirm.type === 'project' ? 'This will also remove all associated tasks.' : 'This action cannot be undone.'}`}
                confirmLabel={`Delete ${deleteConfirm.type === 'project' ? 'Project' : 'Task'}`}
                isLoading={deleteProjectMutation.isPending || deleteTaskMutation.isPending}
            />

            <AnimatePresence>
                {notification && (
                    <Toast
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectDetailPage;
