import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
// Local definitions for project types
export enum ProjectStatus {
    NOT_STARTED = 'Not Started',
    IN_PROGRESS = 'In Progress',
    ON_HOLD = 'On Hold',
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled'
}
import {
    Search,
    Filter,
    Plus,
    Calendar,
    IndianRupee,
    ChevronRight,
    Briefcase,
    Edit2,
    Trash2,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useProjects, useCreateProject, useDeleteProject, useTeam } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle as AlertIcon, Users } from 'lucide-react';
import CustomSelect from '../../components/ui/CustomSelect';
import MultiSelect from '../../components/ui/MultiSelect';
import { useDebounce } from '../../hooks/useDebounce';
import ActionMenu, { ActionMenuItem } from '../../components/ui/ActionMenu';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import Toast from '../../components/ui/Toast';
import { AnimatePresence } from 'framer-motion';

const ProjectCard: React.FC<{
    project: any;
    index: number;
    onEdit: (project: any) => void;
    onDelete: (id: string) => void;
}> = ({ project, index, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isAuthorized = user?.role === 'SUPER_ADMIN' || user?.role === 'PROJECT_MANAGER';

    const menuItems: ActionMenuItem[] = [
        { id: 'edit', label: 'Edit Project', icon: Edit2, onClick: () => onEdit(project) },
        { id: 'delete', label: 'Delete Project', icon: Trash2, onClick: () => onDelete(project._id), destructive: true },
    ];

    const handleCardClick = () => {
        navigate(`/projects/${project._id || project.id}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={handleCardClick}
            className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-all group cursor-pointer"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${project.status === ProjectStatus.IN_PROGRESS ? 'bg-primary-100 text-primary-600' :
                    project.status === ProjectStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' :
                        'bg-secondary-100 text-secondary-600'
                    }`}>
                    {project.status}
                </div>
                {isAuthorized && <ActionMenu items={menuItems} />}
            </div>

            <h3 className="text-xl font-bold mb-2 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                {project.name}
            </h3>
            <p className="text-secondary-500 text-sm mb-6 line-clamp-2">
                {project.description || 'No description provided for this project.'}
            </p>

            <div className={`grid ${user?.role === 'SUPER_ADMIN' ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-6`}>
                <div className="flex items-center gap-2 text-secondary-600">
                    <Calendar size={16} />
                    <span className="text-xs font-medium">
                        {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
                {user?.role === 'SUPER_ADMIN' && (
                    <div className="flex items-center gap-2 text-secondary-600">
                        <IndianRupee size={16} />
                        <span className="text-xs font-medium">₹{project.budget?.toLocaleString('en-IN')}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border group/footer">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-card bg-primary-100 flex items-center justify-center text-[10px] font-bold text-primary-700 shadow-sm">
                        {project.manager?.name?.charAt(0) || 'M'}
                    </div>
                    <span className="text-xs font-medium text-secondary-600">
                        {project.manager?.name || 'Assigned Lead'}
                    </span>
                </div>
                {project.collaborators && project.collaborators.length > 0 && (
                    <div className="flex -space-x-2">
                        {project.collaborators.slice(0, 3).map((col: any, i: number) => (
                            <div
                                key={col.id || i}
                                className="w-6 h-6 rounded-full border-2 border-card bg-secondary-100 flex items-center justify-center text-[8px] font-bold text-secondary-600"
                                title={col.name}
                            >
                                {col.name?.charAt(0)}
                            </div>
                        ))}
                        {project.collaborators.length > 3 && (
                            <div className="w-6 h-6 rounded-full border-2 border-card bg-secondary-200 flex items-center justify-center text-[8px] font-bold text-secondary-600">
                                +{project.collaborators.length - 3}
                            </div>
                        )}
                    </div>
                )}
                <div className="flex items-center text-primary-600 font-bold text-sm group-hover/footer:gap-2 transition-all">
                    Details <ChevronRight size={16} />
                </div>
            </div>
        </motion.div>
    );
};

const ProjectListPage: React.FC = () => {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { data: projects, isLoading, error } = useProjects();
    const { data: members } = useTeam();
    const createProjectMutation = useCreateProject();
    const deleteProjectMutation = useDeleteProject();

    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; projectId: string | null }>({
        isOpen: false,
        projectId: null,
    });
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

    const onSubmit = (data: any) => {
        const currentUser = user as any;
        const currentUserRole = currentUser?.role;

        let managerId = data.manager;

        // RBAC logic from backend:
        // PM creates -> they are forced as manager
        // Admin creates -> they choose a manager
        if (currentUserRole === 'PROJECT_MANAGER') {
            managerId = currentUser.id || currentUser._id;
        } else if (currentUserRole === 'SUPER_ADMIN') {
            if (!managerId) {
                setNotification({ message: 'Please select a Project Manager', type: 'error' });
                return;
            }
        } else {
            setNotification({ message: 'Not authorized to create projects', type: 'error' });
            return;
        }

        const payload = {
            ...data,
            manager: managerId,
            collaborators: data.collaborators || [],
            status: ProjectStatus.NOT_STARTED,
            startDate: data.startDate || new Date().toISOString(),
            clientName: data.clientName || 'Default Client'
        };

        createProjectMutation.mutate(payload, {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
                setNotification({ message: 'Project created successfully!', type: 'success' });
            },
            onError: (err: any) => {
                setNotification({ message: err.response?.data?.message || err.message || 'Failed to create project', type: 'error' });
            }
        });
    };

    const handleEdit = (project: any) => {
        // Edit modal logic
        console.log('Editing project:', project);
    };

    const handleDelete = (projectId: string) => {
        setDeleteConfirm({ isOpen: true, projectId });
    };

    const confirmDelete = () => {
        if (deleteConfirm.projectId) {
            deleteProjectMutation.mutate(deleteConfirm.projectId, {
                onSuccess: () => {
                    setDeleteConfirm({ isOpen: false, projectId: null });
                }
            });
        }
    };

    const filteredProjects = projects?.filter((p: any) => {
        const query = debouncedSearch.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(query) ||
            p.clientName?.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query);
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusOptions = [
        { id: 'ALL', label: 'All Projects', icon: Filter, color: 'text-secondary-600', bg: 'bg-secondary-50' },
        { id: ProjectStatus.IN_PROGRESS, label: 'In Progress', icon: Clock, color: 'text-primary-600', bg: 'bg-primary-50' },
        { id: ProjectStatus.COMPLETED, label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: ProjectStatus.NOT_STARTED, label: 'Pending', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                <p className="text-secondary-500 font-medium tracking-wide">Loading your projects...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-red-600">
                <AlertIcon size={40} />
                <p className="font-bold text-xl uppercase tracking-tight">Failed to load projects</p>
                <p className="text-secondary-500 text-sm">{(error as any).response?.data?.message || 'Something went wrong'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-secondary-500 mt-1">Manage and track all your active projects.</p>
                </div>
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'PROJECT_MANAGER') && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all font-mono tracking-tighter"
                    >
                        <Plus size={20} />
                        Create Project
                    </button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search projects by name, client, or manager..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-card border border-border focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl transition-all outline-none shadow-sm"
                    />
                </div>
                <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                    <CustomSelect
                        options={statusOptions}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        className="w-[180px]"
                    />
                    <div className="bg-secondary-100 p-1 rounded-xl flex items-center h-[42px]">
                        <button
                            onClick={() => setView('grid')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all h-full flex items-center ${view === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-secondary-500'}`}
                        >
                            Grid
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all h-full flex items-center ${view === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-secondary-500'}`}
                        >
                            List
                        </button>
                    </div>
                </div>
            </div>

            {view === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects?.map((project: any, index: number) => (
                        <ProjectCard
                            key={project._id || project.id || index}
                            project={project}
                            index={index}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                    {(filteredProjects?.length === 0 || projects?.length === 0) && (
                        <div className="col-span-full py-20 text-center bg-card rounded-2xl border-2 border-dashed border-border">
                            <p className="text-secondary-500 font-medium">
                                {projects?.length === 0 ? "No projects found. Click \"Create Project\" to get started!" : "No projects match your search."}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-secondary-50 text-secondary-600 text-[10px] font-bold uppercase tracking-wider">
                            <tr>
                                <th className="py-4 px-6">Project</th>
                                <th className="py-4 px-6">Status</th>
                                {user?.role === 'SUPER_ADMIN' && <th className="py-4 px-6">Budget</th>}
                                <th className="py-4 px-6">Lead</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredProjects?.map((project: any, index: number) => (
                                <tr
                                    key={project._id || project.id || index}
                                    onClick={() => navigate(`/projects/${project._id || project.id}`)}
                                    className="hover:bg-secondary-50/50 transition-colors group cursor-pointer"
                                >
                                    <td className="py-4 px-6">
                                        <div>
                                            <p className="font-bold text-foreground group-hover:text-primary-600 transition-colors uppercase">{project.name}</p>
                                            <p className="text-xs text-secondary-500">{project.clientName}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${project.status === ProjectStatus.IN_PROGRESS ? 'bg-primary-100 text-primary-600' :
                                            project.status === ProjectStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' :
                                                'bg-secondary-100 text-secondary-600'
                                            }`}>
                                            {project.status}
                                        </div>
                                    </td>
                                    {user?.role === 'SUPER_ADMIN' && (
                                        <td className="py-4 px-6 font-mono text-sm font-bold">
                                            ₹{project.budget?.toLocaleString('en-IN')}
                                        </td>
                                    )}
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center text-[10px] font-bold text-primary-700">
                                                    {project.manager?.name?.charAt(0) || 'M'}
                                                </div>
                                                <span className="text-xs font-semibold text-secondary-900">{project.manager?.name || 'Assigned Lead'}</span>
                                            </div>
                                            {project.collaborators && project.collaborators.length > 0 && (
                                                <div className="flex items-center gap-1 ml-1">
                                                    <Users size={12} className="text-secondary-400" />
                                                    <span className="text-[10px] font-medium text-secondary-500">
                                                        {project.collaborators.length} collaborator(s)
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'PROJECT_MANAGER') && (
                                            <ActionMenu items={[
                                                { id: 'view', label: 'View Details', icon: ChevronRight, onClick: () => navigate(`/projects/${project._id || project.id}`) },
                                                { id: 'edit', label: 'Edit', icon: Edit2, onClick: () => handleEdit(project) },
                                                { id: 'delete', label: 'Delete', icon: Trash2, onClick: () => handleDelete(project._id || project.id), destructive: true },
                                            ]} />
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {(filteredProjects?.length === 0 || projects?.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-sm text-secondary-500 italic">
                                        No projects found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border flex flex-col my-auto"
                    >
                        {/* Sticky Header */}
                        <div className="flex justify-between items-center px-8 pt-8 pb-4 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
                            <h2 className="text-2xl font-bold">Create New Project</h2>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-secondary-400 hover:text-secondary-600 transition-colors"
                            >
                                <Trash2 size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                            <div className="overflow-y-auto px-8 py-4 space-y-4 flex-1">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Project Name</label>
                                    <input
                                        {...register('name', { required: 'Name is required' })}
                                        className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g. Website Redesign"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name?.message as string}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Client Name</label>
                                    <input
                                        {...register('clientName', { required: 'Client Name is required' })}
                                        className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g. Acme Corp"
                                    />
                                    {errors.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName?.message as string}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        {...register('description')}
                                        className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 h-24"
                                        placeholder="Project details..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Start Date</label>
                                        <input
                                            {...register('startDate', { required: 'Start date is required' })}
                                            type="date"
                                            className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                        {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate?.message as string}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Deadline (End Date)</label>
                                        <input
                                            {...register('endDate', { required: 'End date is required' })}
                                            type="date"
                                            className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                        {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate?.message as string}</p>}
                                    </div>
                                </div>
                                {(user as any)?.role === 'SUPER_ADMIN' && (
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-bold text-secondary-500 uppercase tracking-widest mb-1.5 ml-1">
                                            Project Manager <span className="text-rose-400">(required)</span>
                                        </label>
                                        <Controller
                                            name="manager"
                                            control={control}
                                            rules={{ required: 'Manager is required' }}
                                            render={({ field }) => (
                                                <CustomSelect
                                                    options={members?.filter((m: any) => m.role === 'PROJECT_MANAGER').map((m: any) => ({
                                                        id: m.id || m._id,
                                                        label: m.name,
                                                        icon: Briefcase,
                                                        color: 'text-blue-600',
                                                        bg: 'bg-blue-50'
                                                    })) || []}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select a Project Manager..."
                                                    searchable={true}
                                                />
                                            )}
                                        />
                                        {errors.manager && <p className="text-rose-500 text-[10px] font-bold uppercase mt-1 px-1">{errors.manager?.message as string}</p>}
                                    </div>
                                )}

                                {user?.role === 'SUPER_ADMIN' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1 flex items-center gap-1.5 text-secondary-900">
                                            <span className="text-secondary-400 font-bold text-base leading-none">₹</span>
                                            Budget (INR)
                                        </label>
                                        <input
                                            {...register('budget', { valueAsNumber: true })}
                                            type="number"
                                            className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="500000"
                                        />
                                        {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget?.message as string}</p>}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[11px] font-bold text-secondary-500 uppercase tracking-widest mb-1.5 ml-1">
                                        Collaborators (Team Members)
                                    </label>
                                    <Controller
                                        name="collaborators"
                                        control={control}
                                        defaultValue={[]}
                                        render={({ field }) => (
                                            <MultiSelect
                                                options={members?.filter((m: any) => m.role !== 'SUPER_ADMIN' && m.role !== 'PROJECT_MANAGER').map((m: any) => ({
                                                    id: m.id || m._id,
                                                    label: m.name,
                                                    icon: Users,
                                                    color: 'text-primary-600',
                                                    bg: 'bg-primary-50'
                                                })) || []}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Assign team members..."
                                            />
                                        )}
                                    />
                                </div>
                            </div>{/* end scrollable body */}

                            {/* Sticky Footer */}
                            <div className="flex justify-end gap-3 px-8 py-4 border-t border-border bg-card rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2 rounded-xl font-semibold hover:bg-secondary-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={createProjectMutation.isPending}
                                    className="bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center gap-2"
                                >
                                    {createProjectMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, projectId: null })}
                onConfirm={confirmDelete}
                title="Delete Project"
                message="Are you sure you want to delete this project? This will also remove all associated tasks and cannot be undone."
                confirmLabel="Delete Project"
                isLoading={deleteProjectMutation.isPending}
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

export default ProjectListPage;
