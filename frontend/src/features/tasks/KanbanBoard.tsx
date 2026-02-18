import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TaskStatus, TaskPriority } from '../../../../backend/src/common/types/task';
import {
    MoreVertical,
    Plus,
    MessageCircle,
    Paperclip,
    Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTasks, useProjects, useCreateTask, useUpdateTask, useDeleteTask, useAddComment } from '../../hooks/useApi';
import { Loader2, AlertCircle as AlertIcon, Shield, Briefcase, Zap, AlertCircle, Clock as ClockIcon } from 'lucide-react';
import CustomSelect, { SelectOption } from '../../components/ui/CustomSelect';
import TaskDetailModal from './TaskDetailModal';

const priorityOptions: SelectOption[] = [
    { id: TaskPriority.LOW, label: 'Low', icon: ClockIcon, color: 'text-primary-600', bg: 'bg-primary-50' },
    { id: TaskPriority.MEDIUM, label: 'Medium', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: TaskPriority.HIGH, label: 'High', icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: TaskPriority.URGENT, label: 'Urgent', icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
];

interface Task {
    _id: string;
    title: string;
    priority: TaskPriority;
    status: TaskStatus;
    commentsCount?: number;
    filesCount?: number;
    comments?: any[];
    files?: string[];
    dueDate: string;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    createdBy?: {
        _id: string;
        name: string;
        role: string;
    };
    rejectionReason?: string;
}

const TaskCard: React.FC<{ task: Task; onClick?: () => void }> = ({ task, onClick }) => {
    const priorityColors: Record<string, string> = {
        LOW: 'bg-blue-100 text-blue-700',
        MEDIUM: 'bg-amber-100 text-amber-700',
        HIGH: 'bg-orange-100 text-orange-700',
        URGENT: 'bg-red-100 text-red-700',
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card p-4 rounded-xl border border-border mt-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative"
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2 gap-2">
                <div className="flex gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${priorityColors[task.priority] || 'bg-secondary-100 text-secondary-700'}`}>
                        {task.priority}
                    </span>
                    {task.approvalStatus && task.approvalStatus !== 'approved' && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${task.approvalStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                            {task.approvalStatus === 'pending' ? '⏳ Pending' : '❌ Rejected'}
                        </span>
                    )}
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="text-secondary-400 group-hover:text-secondary-600"
                >
                    <MoreVertical size={16} />
                </button>
            </div>

            <h4 className="text-sm font-semibold mb-3 group-hover:text-primary-600 transition-colors">{task.title}</h4>

            <div className="flex items-center justify-between text-secondary-500">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <MessageCircle size={14} />
                        <span className="text-[10px]">{task.commentsCount || task.comments?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Paperclip size={14} />
                        <span className="text-[10px]">{task.filesCount || task.files?.length || 0}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                    <Clock size={14} />
                    <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}</span>
                </div>
            </div>
        </motion.div>
    );
};

const KanbanColumn: React.FC<{
    title: string;
    status: TaskStatus;
    tasks: Task[];
    onAddTask: (status: TaskStatus) => void;
    onTaskClick: (task: Task) => void;
}> = ({ title, status, tasks, onAddTask, onTaskClick }) => (
    <div className="bg-secondary-50/50 rounded-2xl p-4 flex flex-col min-h-[500px] border border-transparent hover:border-border transition-colors">
        <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
                <h3 className="font-bold text-secondary-900">{title}</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-secondary-500 shadow-sm border border-border">
                    {tasks.length}
                </span>
            </div>
            <button
                onClick={() => onAddTask(status)}
                className="p-1 hover:bg-white rounded-lg transition-colors text-secondary-500 hover:text-primary-600"
            >
                <Plus size={18} />
            </button>
        </div>

        <div className="flex-1 space-y-3">
            {tasks.map(task => (
                <TaskCard key={task._id} task={task} onClick={() => onTaskClick(task)} />
            ))}
            <button
                onClick={() => onAddTask(status)}
                className="w-full py-2 border-2 border-dashed border-secondary-200 rounded-xl text-secondary-400 text-sm font-medium hover:bg-white hover:border-primary-300 hover:text-primary-500 transition-all mt-2"
            >
                + Add Task
            </button>
        </div>
    </div>
);

const KanbanBoard: React.FC = () => {
    const { data: projects } = useProjects();
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Auto-select first project
    React.useEffect(() => {
        if (projects && projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projects[0]._id);
        }
    }, [projects, selectedProjectId]);

    const { data: tasks, isLoading, error } = useTasks(selectedProjectId);
    const createTaskMutation = useCreateTask();
    const updateTaskMutation = useUpdateTask();
    const deleteTaskMutation = useDeleteTask();
    const addCommentMutation = useAddComment();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeStatus, setActiveStatus] = useState<TaskStatus>(TaskStatus.TODO);

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

    const onSubmit = (data: any) => {
        createTaskMutation.mutate({
            ...data,
            status: activeStatus,
            project: selectedProjectId
        }, {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            }
        });
    };

    const handleTaskClick = (task: any) => {
        setSelectedTask(task);
        setIsDetailModalOpen(true);
    };

    const handleUpdateTask = (taskId: string, data: any) => {
        updateTaskMutation.mutate({ taskId, data }, {
            onSuccess: () => {
                setIsDetailModalOpen(false);
                setSelectedTask(null);
            }
        });
    };

    const handleDeleteTask = (taskId: string) => {
        deleteTaskMutation.mutate(taskId, {
            onSuccess: () => {
                setIsDetailModalOpen(false);
                setSelectedTask(null);
            }
        });
    };

    const handleAddComment = async (taskId: string, text: string) => {
        return addCommentMutation.mutateAsync({ taskId, text });
    };

    const columns = [
        { title: 'To Do', status: TaskStatus.TODO },
        { title: 'In Progress', status: TaskStatus.IN_PROGRESS },
        { title: 'In Review', status: TaskStatus.IN_REVIEW },
        { title: 'Completed', status: TaskStatus.COMPLETED },
    ];

    const handleAddTask = (status: TaskStatus) => {
        setActiveStatus(status);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                <p className="text-secondary-500 font-medium tracking-wide">Loading board...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Task Board</h1>
                    <p className="text-secondary-500 mt-1">Manage tasks visually across stages.</p>
                </div>
                <div className="flex items-center gap-3">
                    <CustomSelect
                        options={projects?.map((p: any) => ({
                            id: p._id,
                            label: p.name,
                            icon: Briefcase,
                            color: 'text-primary-600',
                            bg: 'bg-primary-50'
                        })) || []}
                        value={selectedProjectId}
                        onChange={setSelectedProjectId}
                        placeholder="Select Project"
                        className="w-[240px]"
                        searchable={true}
                    />
                </div>
            </div>

            {error ? (
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex items-center gap-4">
                    <AlertIcon size={24} />
                    <div>
                        <p className="font-bold uppercase tracking-tight">Failed to load tasks</p>
                        <p className="text-xs">Please check your connection and try again.</p>
                    </div>
                </div>
            ) : (
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                    {columns.map(column => (
                        <div key={column.status} className="min-w-[280px] sm:min-w-[320px] lg:flex-1">
                            <KanbanColumn
                                title={column.title}
                                status={column.status}
                                tasks={tasks?.filter((t: any) => t.status === column.status) || []}
                                onAddTask={handleAddTask}
                                onTaskClick={handleTaskClick}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Task Detail Modal */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setSelectedTask(null);
                    }}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    onAddComment={handleAddComment}
                />
            )}

            {/* Add Task Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-8"
                    >
                        <h2 className="text-2xl font-bold mb-6">Add New Task to {activeStatus.replace('_', ' ')}</h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Task Title</label>
                                <input
                                    {...register('title', { required: 'Title is required' })}
                                    className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="e.g. Design Login Page"
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-secondary-500 uppercase tracking-widest mb-1.5 ml-1">
                                    Priority Level
                                </label>
                                <Controller
                                    name="priority"
                                    control={control}
                                    defaultValue={TaskPriority.MEDIUM}
                                    render={({ field }) => (
                                        <CustomSelect
                                            options={priorityOptions}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select priority"
                                        />
                                    )}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Due Date</label>
                                <input
                                    {...register('dueDate')}
                                    type="date"
                                    className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
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
                                    disabled={createTaskMutation.isPending}
                                    className="bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center gap-2"
                                >
                                    {createTaskMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Add Task'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default KanbanBoard;
