import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    MessageCircle,
    Paperclip,
    Send,
    Calendar,
    User,
    Edit2,
    Trash2,
    Upload,
    Users,
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import CustomSelect from '../../components/ui/CustomSelect';
import { useTeam, useApproveTask, useRejectTask, useUpload } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { Loader2 } from 'lucide-react';

interface Comment {
    _id?: string;
    user: {
        _id: string;
        name: string;
    };
    text: string;
    timestamp: Date;
}

interface TaskDetailModalProps {
    task: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: (taskId: string, data: any) => void;
    onDelete?: (taskId: string) => void;
    onAddComment?: (taskId: string, comment: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
    task,
    isOpen,
    onClose,
    onUpdate,
    onDelete,
    onAddComment
}) => {
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const uploadMutation = useUpload();

    const { data: teamMembers } = useTeam();
    const approveTaskMutation = useApproveTask();
    const rejectTaskMutation = useRejectTask();

    const formatDate = (date: any) => {
        if (!date) return '';
        const d = new Date(date);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    };

    const { register, handleSubmit, control, reset } = useForm({
        defaultValues: {
            title: task.title,
            description: task.description,
            dueDate: formatDate(task.dueDate),
            assignedTo: task.assignedTo?.id || task.assignedTo?._id || task.assignedTo,
            rk: ''
        }
    });

    React.useEffect(() => {
        if (task) {
            reset({
                title: task.title,
                description: task.description,
                dueDate: formatDate(task.dueDate),
                assignedTo: task.assignedTo?.id || task.assignedTo?._id || task.assignedTo,
                rk: ''
            });
        }
    }, [task, reset]);

    const isAdmin = user?.role === 'SUPER_ADMIN';
    const canApprove = isAdmin && task.approvalStatus === 'pending';

    if (!isOpen) return null;

    const handleAddComment = async () => {
        if (!commentText.trim()) return;

        setIsSubmittingComment(true);
        try {
            await onAddComment?.(task._id || task.id, commentText);
            setCommentText('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await uploadMutation.mutateAsync(file);
            // After successful upload, update the task with the new file URL
            const currentFiles = task.files || [];
            onUpdate?.(task._id || task.id, {
                files: [...currentFiles, data.url]
            });
        } catch (error) {
            console.error('File upload failed:', error);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUpdateTask = (data: any) => {
        onUpdate?.(task._id, data);
        setIsEditing(false);
    };

    const handleDeleteTask = () => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            onDelete?.(task._id);
            onClose();
        }
    };

    const handleApprove = () => {
        approveTaskMutation.mutate(task._id, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }
        rejectTaskMutation.mutate({ taskId: task._id, reason: rejectionReason }, {
            onSuccess: () => {
                setShowRejectModal(false);
                setRejectionReason('');
                onClose();
            }
        });
    };

    const priorityColors: Record<string, string> = {
        low: 'bg-blue-100 text-blue-700',
        medium: 'bg-amber-100 text-amber-700',
        high: 'bg-orange-100 text-orange-700',
        urgent: 'bg-red-100 text-red-700',
    };

    const statusColors: Record<string, string> = {
        todo: 'bg-secondary-100 text-secondary-700',
        'in-progress': 'bg-primary-100 text-primary-700',
        'in-review': 'bg-purple-100 text-purple-700',
        completed: 'bg-emerald-100 text-emerald-700',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-border flex items-start justify-between">
                    <div className="flex-1">
                        {isEditing ? (
                            <input
                                {...register('title', { required: 'Title is required' })}
                                className="text-2xl font-bold w-full px-3 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        ) : (
                            <h2 className="text-2xl font-bold">{task.title}</h2>
                        )}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${statusColors[task.status] || 'bg-secondary-100 text-secondary-700'}`}>
                                {task.status?.replace('-', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${priorityColors[task.priority] || 'bg-secondary-100 text-secondary-700'}`}>
                                {task.priority}
                            </span>
                            {task.approvalStatus && (
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${task.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    task.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {task.approvalStatus === 'pending' && '⏳ Pending Approval'}
                                    {task.approvalStatus === 'approved' && '✓ Approved'}
                                    {task.approvalStatus === 'rejected' && '❌ Rejected'}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={handleDeleteTask}
                                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Task Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-sm">
                            <User size={16} className="text-secondary-500" />
                            <div>
                                <p className="text-xs text-secondary-500">Assigned To</p>
                                <p className="font-medium">{task.assignedTo?.name || 'Unassigned'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar size={16} className="text-secondary-500" />
                            <div>
                                {isEditing ? (
                                    <>
                                        <label htmlFor="dueDate" className="block text-sm font-medium text-secondary-700 mb-2">Due Date</label>
                                        <input
                                            id="dueDate"
                                            type="date"
                                            {...register('dueDate')}
                                            className="w-full px-4 py-2.5 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                        />
                                    </>
                                ) : (
                                    <p className="font-medium">
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'}
                                    </p>
                                )}
                            </div>
                        </div>
                        {isEditing && (
                            <div className="flex items-center gap-3 text-sm">
                                <Users size={16} className="text-secondary-500" />
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-2">Assign To</label>
                                    <Controller
                                        name="assignedTo"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomSelect
                                                options={teamMembers?.map((member: any) => ({
                                                    id: member.id || member._id,
                                                    label: member.name,
                                                    icon: Users,
                                                    color: 'text-primary-600',
                                                    bg: 'bg-primary-50'
                                                })) || []}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select member"
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Approval Information */}
                    {task.approvalStatus && task.approvalStatus !== 'approved' && (
                        <div className={`p-4 rounded-xl border ${task.approvalStatus === 'pending' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                            }`}>
                            <div className="flex items-start gap-3">
                                {task.approvalStatus === 'pending' ? (
                                    <Clock className="text-yellow-600 flex-shrink-0" size={20} />
                                ) : (
                                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                                )}
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm mb-1">
                                        {task.approvalStatus === 'pending' ? 'Pending Admin Approval' : 'Task Rejected'}
                                    </h4>
                                    {task.createdBy && (
                                        <p className="text-xs text-secondary-600 mb-2">
                                            Created by {task.createdBy.name} ({task.createdBy.role})
                                        </p>
                                    )}
                                    {task.rejectionReason && (
                                        <div className="mt-2 p-3 bg-white rounded-lg">
                                            <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                                            <p className="text-sm text-secondary-700">{task.rejectionReason}</p>
                                        </div>
                                    )}
                                    {canApprove && (
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={handleApprove}
                                                disabled={approveTaskMutation.isPending}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-semibold"
                                            >
                                                <CheckCircle size={16} />
                                                {approveTaskMutation.isPending ? 'Approving...' : 'Approve Task'}
                                            </button>
                                            <button
                                                onClick={() => setShowRejectModal(true)}
                                                disabled={rejectTaskMutation.isPending}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-semibold"
                                            >
                                                <XCircle size={16} />
                                                Reject Task
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {task.approvedBy && task.approvalStatus === 'approved' && (
                        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                            <div className="flex items-center gap-2 text-sm text-green-700">
                                <CheckCircle size={16} />
                                <span>
                                    Approved by {task.approvedBy.name} on {new Date(task.approvedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <h3 className="text-sm font-bold text-secondary-500 uppercase tracking-wider mb-2">Description</h3>
                        {isEditing ? (
                            <textarea
                                {...register('description')}
                                className="w-full px-4 py-3 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                                placeholder="Add task description..."
                            />
                        ) : (
                            <p className="text-secondary-700">{task.description || 'No description provided.'}</p>
                        )}
                    </div>

                    {isEditing && (
                        <div>
                            <h3 className="text-sm font-bold text-secondary-500 uppercase tracking-wider mb-2">Remark (RK)</h3>
                            <input
                                {...register('rk')}
                                className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Add a remark for this update..."
                            />
                        </div>
                    )}

                    {isEditing && (
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 rounded-xl font-semibold hover:bg-secondary-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit(handleUpdateTask)}
                                className="bg-primary-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-primary-700 transition-all"
                            >
                                Save Changes
                            </button>
                        </div>
                    )}

                    {/* File Attachments */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-secondary-500 uppercase tracking-wider flex items-center gap-2">
                                <Paperclip size={16} />
                                Attachments ({task.files?.length || 0})
                            </h3>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadMutation.isPending}
                                className="text-primary-600 text-xs font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
                            >
                                {uploadMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                Upload File
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>
                        {task.files && task.files.length > 0 ? (
                            <div className="space-y-2">
                                {task.files.map((file: string, index: number) => {
                                    const fileName = file.split('/').pop() || 'Attachment';
                                    return (
                                        <div key={index} className="flex items-center gap-2 p-3 bg-secondary-50 rounded-lg">
                                            <Paperclip size={14} className="text-secondary-500" />
                                            <span className="text-sm flex-1 truncate">{fileName}</span>
                                            <a
                                                href={file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary-600 text-xs font-bold hover:underline"
                                            >
                                                Download
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-secondary-500 text-sm italic">No attachments yet.</p>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div>
                        <h3 className="text-sm font-bold text-secondary-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <MessageCircle size={16} />
                            Comments ({task.comments?.length || 0})
                        </h3>

                        {/* Comments List */}
                        <div className="space-y-4 mb-4">
                            {task.comments && task.comments.length > 0 ? (
                                task.comments.map((comment: Comment, index: number) => (
                                    <div key={index} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                                            {comment.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-sm">{comment.user?.name || 'Unknown User'}</span>
                                                <span className="text-xs text-secondary-500">
                                                    {new Date(comment.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-secondary-700 bg-secondary-50 p-3 rounded-lg">{comment.text}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-secondary-500 text-sm italic">No comments yet. Be the first to comment!</p>
                            )}
                        </div>

                        {/* Add Comment */}
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                                    placeholder="Add a comment..."
                                    className="flex-1 px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!commentText.trim() || isSubmittingComment}
                                    className="bg-primary-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <XCircle className="text-red-600" size={24} />
                            <h3 className="text-xl font-bold">Reject Task</h3>
                        </div>
                        <p className="text-secondary-600 text-sm mb-4">
                            Please provide a reason for rejecting this task. This will be visible to the task creator.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Explain why this task is being rejected..."
                            className="w-full px-4 py-3 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
                            rows={4}
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason.trim() || rejectTaskMutation.isPending}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-semibold"
                            >
                                {rejectTaskMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                }}
                                className="flex-1 px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors text-sm font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default TaskDetailModal;
