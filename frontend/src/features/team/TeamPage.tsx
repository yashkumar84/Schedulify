import React, { useState } from 'react';
import {
    Users,
    Mail,
    Search,
    Plus,
    UserCheck,
    UserMinus,
    Briefcase,
    CreditCard,
    Edit2,
    Trash2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeam, useUpdateUserRole, useDeleteMember, useUpdateMember, useRegister } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { Loader2 } from 'lucide-react';
import CustomSelect, { SelectOption } from '../../components/ui/CustomSelect';
import { useDebounce } from '../../hooks/useDebounce';
import { useForm, Controller } from 'react-hook-form';
import ActionMenu, { ActionMenuItem } from '../../components/ui/ActionMenu';

const RoleDropdown: React.FC<{
    value: string;
    onChange: (role: string) => void;
    isSuperAdmin: boolean;
}> = ({ value, onChange, isSuperAdmin }) => {
    const roles: SelectOption[] = [
        { id: 'PROJECT_MANAGER', label: 'Project Manager', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'INHOUSE_TEAM', label: 'Inhouse Team', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'OUTSOURCED_TEAM', label: 'Outsourced Team', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'FINANCE_TEAM', label: 'Finance Team', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    if (!isSuperAdmin) {
        const currentRole = roles.find(r => r.id === value) || roles[2];
        const Icon = currentRole.icon;
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ring-1 ring-inset ${currentRole.bg} ${currentRole.color} bg-opacity-40 ring-current`}>
                {Icon && <Icon size={14} />}
                <span>{currentRole.label}</span>
            </div>
        );
    }

    return (
        <CustomSelect
            options={roles}
            value={value}
            onChange={onChange}
            className="w-[200px]"
        />
    );
};

const UserRow: React.FC<{
    user: any;
    index: number;
    onRoleChange: (id: string, role: string) => void;
    onEdit: (user: any) => void;
    onDelete: (id: string) => void;
    isSuperAdmin: boolean;
}> = ({ user, index, onRoleChange, onEdit, onDelete, isSuperAdmin }) => {
    const menuItems: ActionMenuItem[] = [];
    if (isSuperAdmin) {
        menuItems.push(
            { id: 'edit', label: 'Edit Member', icon: Edit2, onClick: () => onEdit(user) },
            { id: 'delete', label: 'Remove Member', icon: Trash2, onClick: () => onDelete(user.id), destructive: true },
        );
    }

    return (
        <motion.tr
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border-b border-border hover:bg-secondary-50 transition-colors"
        >
            <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold uppercase shadow-lg shadow-primary-500/20">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-foreground">{user.name}</p>
                        <p className="text-xs text-secondary-500 flex items-center gap-1">
                            <Mail size={12} /> {user.email}
                        </p>
                    </div>
                </div>
            </td>
            <td className="py-4 px-6">
                <RoleDropdown
                    value={user.role}
                    onChange={(role) => onRoleChange(user.id, role)}
                    isSuperAdmin={isSuperAdmin}
                />
            </td>
            <td className="py-4 px-6">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                    {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
            </td>
            <td className="py-4 px-6 text-right">
                {menuItems.length > 0 && <ActionMenu items={menuItems} />}
            </td>
        </motion.tr>
    );
};

const TeamPage: React.FC = () => {
    const { data: users, isLoading } = useTeam();
    const { user: currentUser } = useAuthStore();
    const updateRoleMutation = useUpdateUserRole();
    const deleteMemberMutation = useDeleteMember();

    const [roleFilter, setRoleFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState(false);

    const updateMemberMutation = useUpdateMember();
    const registerMutation = useRegister();

    const editForm = useForm();
    const inviteForm = useForm();

    const debouncedSearch = useDebounce(searchQuery, 300);
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    const handleRoleChange = (userId: string, role: string) => {
        if (!isSuperAdmin) return;
        updateRoleMutation.mutate({ userId, role });
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        editForm.setValue('name', user.name);
        editForm.setValue('email', user.email);
        editForm.setValue('role', user.role);
    };

    const onEditSubmit = (data: any) => {
        if (!editingUser) return;
        updateMemberMutation.mutate(
            { userId: editingUser.id || editingUser._id, data },
            {
                onSuccess: () => {
                    setEditingUser(null);
                    editForm.reset();
                }
            }
        );
    };

    const onInviteSubmit = (data: any) => {
        registerMutation.mutate(
            data,
            {
                onSuccess: () => {
                    setInviteSuccess(true);
                    setTimeout(() => {
                        setIsInviteModalOpen(false);
                        setInviteSuccess(false);
                        inviteForm.reset();
                        setToast({ message: 'Member invited successfully!', type: 'success' });
                        setTimeout(() => setToast(null), 3000);
                    }, 2000);
                },
                onError: (err: any) => {
                    setToast({ message: err.response?.data?.message || 'Failed to invite member', type: 'error' });
                    setTimeout(() => setToast(null), 3000);
                }
            }
        );
    };

    const handleDelete = (userId: string) => {
        if (!isSuperAdmin) return;
        deleteMemberMutation.mutate(userId, {
            onSuccess: () => {
                setToast({ message: 'Member removed successfully', type: 'success' });
                setTimeout(() => setToast(null), 3000);
            },
            onError: (err: any) => {
                setToast({ message: err.response?.data?.message || 'Failed to remove member', type: 'error' });
                setTimeout(() => setToast(null), 3000);
            }
        });
    };

    const roles: SelectOption[] = [
        { id: 'ALL', label: 'All Roles', icon: Users, color: 'text-secondary-600', bg: 'bg-secondary-50' },
        { id: 'PROJECT_MANAGER', label: 'Project Manager', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'INHOUSE_TEAM', label: 'Inhouse Team', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'OUTSOURCED_TEAM', label: 'Outsourced Team', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'FINANCE_TEAM', label: 'Finance Team', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    const filteredUsers = users?.filter((u: any) => {
        if (u.role === 'SUPER_ADMIN') return false;
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        const matchesSearch = u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(debouncedSearch.toLowerCase());
        return matchesRole && matchesSearch;
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
            </div>
        );
    }

    const stats = {
        total: users?.length || 0,
        active: users?.filter((u: any) => u.isActive).length || 0,
        pending: 0 // Logic for pending invites if added
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Team Members</h1>
                    <p className="text-secondary-500 mt-1">Manage users, roles, and permissions.</p>
                </div>
                {isSuperAdmin && (
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all"
                    >
                        <Plus size={20} />
                        Invite Member
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
                            <Users size={24} />
                        </div>
                        <h3 className="font-bold text-2xl">{stats.total}</h3>
                    </div>
                    <p className="text-secondary-500 text-sm">Total Members</p>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                            <UserCheck size={24} />
                        </div>
                        <h3 className="font-bold text-2xl">{stats.active}</h3>
                    </div>
                    <p className="text-secondary-500 text-sm">Active Now</p>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                            <UserMinus size={24} />
                        </div>
                        <h3 className="font-bold text-2xl">{stats.pending}</h3>
                    </div>
                    <p className="text-secondary-500 text-sm">Pending Submissions</p>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-secondary-100 hover:bg-secondary-200 focus:bg-white border-transparent focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl transition-all outline-none text-sm"
                        />
                    </div>
                    <CustomSelect
                        options={roles}
                        value={roleFilter}
                        onChange={setRoleFilter}
                        className="w-full md:w-[220px]"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary-50 text-secondary-600 text-xs font-bold uppercase tracking-wider">
                                <th className="py-4 px-6">Member</th>
                                <th className="py-4 px-6">Role</th>
                                <th className="py-4 px-6">Status</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers?.map((u: any, index: number) => (
                                <UserRow
                                    key={u.id}
                                    user={u}
                                    index={index}
                                    onRoleChange={handleRoleChange}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    isSuperAdmin={isSuperAdmin}
                                />
                            ))}
                            {filteredUsers?.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-secondary-500 italic">
                                        No members found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Member Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-8"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Edit Member</h2>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="text-secondary-400 hover:text-secondary-600 transition-colors"
                            >
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <input
                                    {...editForm.register('name', { required: 'Name is required' })}
                                    className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                {editForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.name?.message as string}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email Address</label>
                                <input
                                    {...editForm.register('email', {
                                        required: 'Email is required',
                                        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                                    })}
                                    className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                {editForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.email?.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-secondary-500 uppercase tracking-widest mb-1.5 ml-1">
                                    Member Role
                                </label>
                                <Controller
                                    name="role"
                                    control={editForm.control}
                                    rules={{ required: 'Role is required' }}
                                    render={({ field }) => (
                                        <CustomSelect
                                            options={roles.filter(r => r.id !== 'ALL' && r.id !== 'SUPER_ADMIN')}
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="px-6 py-2 rounded-xl font-semibold hover:bg-secondary-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={updateMemberMutation.isPending}
                                    className="bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center gap-2"
                                >
                                    {updateMemberMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Update Member'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Invite Member Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-8"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Invite New Member</h2>
                            <button
                                onClick={() => setIsInviteModalOpen(false)}
                                className="text-secondary-400 hover:text-secondary-600 transition-colors"
                            >
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <input
                                    {...inviteForm.register('name', { required: 'Name is required' })}
                                    className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="e.g. John Doe"
                                />
                                {inviteForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{inviteForm.formState.errors.name?.message as string}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email Address</label>
                                <input
                                    {...inviteForm.register('email', {
                                        required: 'Email is required',
                                        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                                    })}
                                    className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="john@example.com"
                                />
                                {inviteForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{inviteForm.formState.errors.email?.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-secondary-500 uppercase tracking-widest mb-1.5 ml-1">
                                    Assign Role
                                </label>
                                <Controller
                                    name="role"
                                    control={inviteForm.control}
                                    defaultValue="INHOUSE_TEAM"
                                    rules={{ required: 'Role is required' }}
                                    render={({ field }) => (
                                        <CustomSelect
                                            options={roles.filter(r => r.id !== 'ALL' && r.id !== 'SUPER_ADMIN')}
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                            <p className="text-[10px] text-secondary-400 italic">
                                * A temporary password will be automatically generated and sent via email.
                            </p>
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="px-6 py-2 rounded-xl font-semibold hover:bg-secondary-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={registerMutation.isPending || inviteSuccess}
                                    className={`${inviteSuccess ? 'bg-emerald-600' : 'bg-primary-600 hover:bg-primary-700'} text-white px-6 py-2 rounded-xl font-semibold transition-all flex items-center gap-2`}
                                >
                                    {registerMutation.isPending ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : inviteSuccess ? (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={18} />
                                            <span>Invite Sent!</span>
                                        </div>
                                    ) : (
                                        'Send Invite'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
                    >
                        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${toast.type === 'success'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                            : 'bg-rose-50 border-rose-100 text-rose-800'
                            }`}>
                            {toast.type === 'success' ? <CheckCircle2 className="text-emerald-500" /> : <AlertCircle className="text-rose-500" />}
                            <span className="font-semibold">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeamPage;
