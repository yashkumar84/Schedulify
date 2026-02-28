import React, { useState } from 'react';
import {
    Users,
    Mail,
    Search,
    Plus,
    UserCheck,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Shield,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeam, useDeleteMember, useUpdateMember, useRegister, useUpdateMemberPermissions } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { Loader2 } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { useForm } from 'react-hook-form';
import ActionMenu, { ActionMenuItem } from '../../components/ui/ActionMenu';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeaturePerms {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
}

interface Permissions {
    projects: FeaturePerms;
    tasks: FeaturePerms;
    finance: FeaturePerms;
    team: FeaturePerms;
}

const emptyPermissions = (): Permissions => ({
    projects: { create: false, read: false, update: false, delete: false },
    tasks: { create: false, read: false, update: false, delete: false },
    finance: { create: false, read: false, update: false, delete: false },
    team: { create: false, read: false, update: false, delete: false }
});

// ─── Permission Grid ──────────────────────────────────────────────────────────

const FEATURES: { key: keyof Permissions; label: string; ops: (keyof FeaturePerms)[] }[] = [
    { key: 'projects', label: 'Projects', ops: ['create', 'read', 'update', 'delete'] },
    { key: 'tasks', label: 'Tasks', ops: ['create', 'read', 'update', 'delete'] },
    { key: 'finance', label: 'Finance', ops: ['create', 'read', 'update', 'delete'] },
    { key: 'team', label: 'Team', ops: ['read'] },
];

const OP_LABELS: Record<keyof FeaturePerms, string> = {
    create: 'Create',
    read: 'Read',
    update: 'Update',
    delete: 'Delete'
};

const PermissionsGrid: React.FC<{
    permissions: Permissions;
    onChange: (perms: Permissions) => void;
}> = ({ permissions, onChange }) => {
    const toggle = (feature: keyof Permissions, op: keyof FeaturePerms) => {
        const updated = {
            ...permissions,
            [feature]: {
                ...permissions[feature],
                [op]: !permissions[feature][op]
            }
        };
        // If "read" is being turned off, turn off create/update/delete too (can't write without read)
        if (op === 'read' && !updated[feature].read) {
            updated[feature] = { create: false, read: false, update: false, delete: false };
        }
        // If any write op is enabled, auto-enable read
        if (op !== 'read' && updated[feature][op]) {
            updated[feature].read = true;
        }
        onChange(updated);
    };

    return (
        <div className="border border-border rounded-xl overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-5 bg-secondary-50 py-2 px-3 text-[11px] font-bold text-secondary-500 uppercase tracking-widest">
                <div>Feature</div>
                {(['create', 'read', 'update', 'delete'] as const).map(op => (
                    <div key={op} className="text-center">{OP_LABELS[op]}</div>
                ))}
            </div>
            {FEATURES.map((feature, fi) => (
                <div
                    key={feature.key}
                    className={`grid grid-cols-5 py-3 px-3 items-center border-t border-border ${fi % 2 === 0 ? 'bg-card' : 'bg-secondary-50/30'}`}
                >
                    <div className="text-sm font-semibold text-secondary-800">{feature.label}</div>
                    {(['create', 'read', 'update', 'delete'] as const).map(op => {
                        const isSupported = feature.ops.includes(op);
                        const checked = isSupported && permissions[feature.key][op];
                        return (
                            <div key={op} className="flex items-center justify-center">
                                {isSupported ? (
                                    <button
                                        type="button"
                                        onClick={() => toggle(feature.key, op)}
                                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-150
                                            ${checked
                                                ? 'bg-primary-600 border-primary-600 shadow-sm shadow-primary-500/30'
                                                : 'border-secondary-300 hover:border-primary-400'
                                            }`}
                                    >
                                        {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                                    </button>
                                ) : (
                                    <span className="w-6 h-6 flex items-center justify-center text-secondary-300">—</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

// ─── Permission Summary Badge ─────────────────────────────────────────────────

const PermissionSummary: React.FC<{ permissions: any }> = ({ permissions }) => {
    if (!permissions) return <span className="text-xs text-secondary-400 italic">No permissions</span>;

    const parts: string[] = [];
    if (permissions.projects?.read) parts.push('Projects');
    if (permissions.tasks?.read) parts.push('Tasks');
    if (permissions.finance?.read) parts.push('Finance');
    if (permissions.team?.read) parts.push('Team');

    if (parts.length === 0) return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary-100 text-secondary-500">
            No Access
        </span>
    );

    return (
        <div className="flex flex-wrap gap-1">
            {parts.map(p => (
                <span key={p} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary-50 text-primary-700 ring-1 ring-primary-100">
                    {p}
                </span>
            ))}
        </div>
    );
};

// ─── User Row ─────────────────────────────────────────────────────────────────

const UserRow: React.FC<{
    user: any;
    index: number;
    onEdit: (user: any) => void;
    onDelete: (id: string) => void;
    isSuperAdmin: boolean;
}> = ({ user, index, onEdit, onDelete, isSuperAdmin }) => {
    const menuItems: ActionMenuItem[] = [];
    if (isSuperAdmin && user.role !== 'SUPER_ADMIN') {
        menuItems.push(
            { id: 'edit', label: 'Edit Permissions', icon: Shield, onClick: () => onEdit(user) },
            { id: 'delete', label: 'Remove Member', icon: Trash2, onClick: () => onDelete(user.id), destructive: true },
        );
    }

    const isAdmin = user.role === 'SUPER_ADMIN';

    return (
        <motion.tr
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border-b border-border hover:bg-secondary-50 transition-colors"
        >
            <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold uppercase shadow-lg
                        ${isAdmin
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20'
                            : 'bg-gradient-to-br from-primary-400 to-primary-600 shadow-primary-500/20'
                        }`}
                    >
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground">{user.name}</p>
                            {isAdmin && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                    <Shield size={10} /> Admin
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-secondary-500 flex items-center gap-1">
                            <Mail size={12} /> {user.email}
                        </p>
                    </div>
                </div>
            </td>
            <td className="py-4 px-6">
                {isAdmin
                    ? <span className="text-xs text-secondary-400 italic">Full access</span>
                    : <PermissionSummary permissions={user.permissions} />
                }
            </td>
            <td className="py-4 px-6">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${user.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {user.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                </span>
            </td>
            <td className="py-4 px-6 text-right">
                {menuItems.length > 0 && <ActionMenu items={menuItems} />}
            </td>
        </motion.tr>
    );
};

// ─── Team Page ──────────────────────────────────────────────────────────────

const TeamPage: React.FC = () => {
    const { data: users, isLoading } = useTeam();
    const { user: currentUser } = useAuthStore();
    const deleteMemberMutation = useDeleteMember();
    const updatePermsMutation = useUpdateMemberPermissions();

    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editPermissions, setEditPermissions] = useState<Permissions>(emptyPermissions());
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [invitePermissions, setInvitePermissions] = useState<Permissions>(emptyPermissions());
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState(false);

    const updateMemberMutation = useUpdateMember();
    const registerMutation = useRegister();

    const editForm = useForm();
    const inviteForm = useForm();

    const debouncedSearch = useDebounce(searchQuery, 300);
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        editForm.setValue('name', user.name);
        const p = user.permissions || emptyPermissions();
        setEditPermissions({
            projects: { create: !!p.projects?.create, read: !!p.projects?.read, update: !!p.projects?.update, delete: !!p.projects?.delete },
            tasks: { create: !!p.tasks?.create, read: !!p.tasks?.read, update: !!p.tasks?.update, delete: !!p.tasks?.delete },
            finance: { create: !!p.finance?.create, read: !!p.finance?.read, update: !!p.finance?.update, delete: !!p.finance?.delete },
            team: { create: false, read: !!p.team?.read, update: false, delete: false }
        });
    };

    const onEditSubmit = (data: any) => {
        if (!editingUser) return;
        const userId = editingUser.id || editingUser._id;

        // Update name if changed
        if (data.name !== editingUser.name) {
            updateMemberMutation.mutate({ userId, data: { name: data.name } });
        }

        // Update permissions
        updatePermsMutation.mutate(
            { userId, permissions: editPermissions },
            {
                onSuccess: () => {
                    setEditingUser(null);
                    editForm.reset();
                    showToast('Member updated successfully!', 'success');
                },
                onError: (err: any) => {
                    showToast(err.response?.data?.message || 'Failed to update member', 'error');
                }
            }
        );
    };

    const onInviteSubmit = (data: any) => {
        registerMutation.mutate(
            { name: data.name, email: data.email, permissions: invitePermissions },
            {
                onSuccess: () => {
                    setInviteSuccess(true);
                    setTimeout(() => {
                        setIsInviteModalOpen(false);
                        setInviteSuccess(false);
                        inviteForm.reset();
                        setInvitePermissions(emptyPermissions());
                        showToast('Member invited successfully!', 'success');
                    }, 2000);
                },
                onError: (err: any) => {
                    showToast(err.response?.data?.message || 'Failed to invite member', 'error');
                }
            }
        );
    };

    const handleDelete = (userId: string) => {
        if (!isSuperAdmin) return;
        deleteMemberMutation.mutate(userId, {
            onSuccess: () => showToast('Member removed successfully', 'success'),
            onError: (err: any) => showToast(err.response?.data?.message || 'Failed to remove member', 'error')
        });
    };

    const filteredUsers = users?.filter((u: any) => {
        const matchesSearch = u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(debouncedSearch.toLowerCase());
        return matchesSearch;
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
        active: users?.filter((u: any) => u.isActive !== false).length || 0,
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Team Members</h1>
                    <p className="text-secondary-500 mt-1">Manage users and their feature permissions.</p>
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

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-primary-50 rounded-xl text-primary-600"><Users size={24} /></div>
                        <h3 className="font-bold text-2xl">{stats.total}</h3>
                    </div>
                    <p className="text-secondary-500 text-sm">Total Members</p>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><UserCheck size={24} /></div>
                        <h3 className="font-bold text-2xl">{stats.active}</h3>
                    </div>
                    <p className="text-secondary-500 text-sm">Active Members</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search members by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-secondary-100 hover:bg-secondary-200 focus:bg-white border-transparent focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl transition-all outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary-50 text-secondary-600 text-xs font-bold uppercase tracking-wider">
                                <th className="py-4 px-6">Member</th>
                                <th className="py-4 px-6">Permissions</th>
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
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    isSuperAdmin={isSuperAdmin}
                                />
                            ))}
                            {filteredUsers?.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-secondary-500 italic">
                                        No members found.
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
                        className="bg-card w-full max-w-xl rounded-2xl shadow-2xl border border-border p-8 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">Edit Member</h2>
                                <p className="text-sm text-secondary-500 mt-0.5">{editingUser.name} — {editingUser.email}</p>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="text-secondary-400 hover:text-secondary-600 transition-colors">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <input
                                    {...editForm.register('name', { required: 'Name is required' })}
                                    className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                {editForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.name?.message as string}</p>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-secondary-500 uppercase tracking-widest mb-3">
                                    Feature Permissions
                                </label>
                                <PermissionsGrid permissions={editPermissions} onChange={setEditPermissions} />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setEditingUser(null)} className="px-6 py-2 rounded-xl font-semibold hover:bg-secondary-100 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    disabled={updatePermsMutation.isPending}
                                    className="bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center gap-2"
                                >
                                    {updatePermsMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
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
                        className="bg-card w-full max-w-xl rounded-2xl shadow-2xl border border-border p-8 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">Invite New Member</h2>
                                <p className="text-sm text-secondary-500 mt-0.5">They'll receive an email with a temporary password.</p>
                            </div>
                            <button onClick={() => { setIsInviteModalOpen(false); inviteForm.reset(); setInvitePermissions(emptyPermissions()); }} className="text-secondary-400 hover:text-secondary-600 transition-colors">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-6">
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

                            <div>
                                <label className="block text-[11px] font-bold text-secondary-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Shield size={12} />
                                    Assign Permissions
                                </label>
                                <PermissionsGrid permissions={invitePermissions} onChange={setInvitePermissions} />
                                <p className="text-[10px] text-secondary-400 italic mt-2">
                                    * Enabling write permissions (Create/Update/Delete) automatically grants Read access.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => { setIsInviteModalOpen(false); inviteForm.reset(); setInvitePermissions(emptyPermissions()); }} className="px-6 py-2 rounded-xl font-semibold hover:bg-secondary-100 transition-colors">
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
