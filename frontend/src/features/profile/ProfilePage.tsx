import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useProfile, useUpdateProfile, useChangePassword } from '../../hooks/useApi';
import {
    User,
    Mail,
    Shield,
    Lock,
    Save,
    UserCircle,
    Camera,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff
} from 'lucide-react';

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { data: profile, isLoading: isProfileLoading } = useProfile();
    const updateProfileMutation = useUpdateProfile();
    const changePasswordMutation = useChangePassword();

    const [profileSuccess, setProfileSuccess] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { register: registerProfile, handleSubmit: handleProfileSubmit } = useForm();
    const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword } = useForm();

    const onUpdateProfile = (data: any) => {
        updateProfileMutation.mutate(data, {
            onSuccess: () => {
                setProfileSuccess(true);
                setTimeout(() => setProfileSuccess(false), 3000);
            },
        });
    };

    const onChangePassword = (data: any) => {
        if (data.currentPassword === data.newPassword) {
            setPasswordError('New password cannot be the same as current password');
            return;
        }
        if (data.newPassword !== data.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }
        setPasswordError('');
        changePasswordMutation.mutate({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword
        }, {
            onSuccess: () => {
                setPasswordSuccess(true);
                resetPassword();
                setTimeout(() => setPasswordSuccess(false), 3000);
            },
            onError: (error: any) => {
                setPasswordError(error.response?.data?.message || 'Failed to change password');
            }
        });
    };

    if (isProfileLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary-600" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Account Settings</h1>
                <p className="text-secondary-500 mt-2">Manage your profile and security preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Summary */}
                <div className="space-y-6">
                    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 text-center">
                        <div className="relative inline-block">
                            <div className="w-32 h-32 rounded-full bg-primary-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                                {profile?.avatar ? (
                                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle size={80} className="text-primary-600" />
                                )}
                            </div>
                            <button className="absolute bottom-1 right-1 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors">
                                <Camera size={18} />
                            </button>
                        </div>
                        <h3 className="text-xl font-bold mt-4">{profile?.name}</h3>
                        <p className="text-secondary-500 text-sm mt-1 capitalize">{profile?.role?.replace('_', ' ').toLowerCase()}</p>

                        <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate('/tasks')}
                                className="p-3 rounded-xl hover:bg-secondary-50 transition-colors text-center group"
                            >
                                <p className="text-2xl font-bold group-hover:text-primary-600 transition-colors">{profile?.taskCount || 0}</p>
                                <p className="text-xs text-secondary-500 uppercase tracking-wider">Tasks</p>
                            </button>
                            <button
                                onClick={() => navigate('/projects')}
                                className="p-3 rounded-xl hover:bg-secondary-50 transition-colors text-center group"
                            >
                                <p className="text-2xl font-bold group-hover:text-primary-600 transition-colors">{profile?.projectCount || 0}</p>
                                <p className="text-xs text-secondary-500 uppercase tracking-wider">Projects</p>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Forms */}
                <div className="md:col-span-2 space-y-8">
                    {/* Profile Form */}
                    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                                <User size={20} />
                            </div>
                            <h3 className="text-xl font-bold">Public Profile</h3>
                        </div>

                        <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                                    <input
                                        {...registerProfile('name')}
                                        defaultValue={profile?.name}
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                                    <input
                                        {...registerProfile('email')}
                                        defaultValue={profile?.email}
                                        type="email"
                                        readOnly
                                        disabled
                                        className="w-full pl-10 pr-4 py-2 bg-secondary-100 border border-border rounded-xl outline-none cursor-not-allowed text-secondary-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                {profileSuccess && (
                                    <span className="text-emerald-600 text-sm flex items-center gap-1">
                                        <CheckCircle2 size={16} /> Profile updated!
                                    </span>
                                )}
                                <div className="ml-auto">
                                    <button
                                        type="submit"
                                        disabled={updateProfileMutation.isPending}
                                        className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all disabled:opacity-50"
                                    >
                                        {updateProfileMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Password Form */}
                    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                <Lock size={20} />
                            </div>
                            <h3 className="text-xl font-bold">Security</h3>
                        </div>

                        <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Current Password</label>
                                <div className="relative">
                                    <input
                                        {...registerPassword('currentPassword', { required: true })}
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition-all pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 focus:outline-none transition-colors"
                                    >
                                        {showCurrentPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">New Password</label>
                                    <div className="relative">
                                        <input
                                            {...registerPassword('newPassword', { required: true })}
                                            type={showNewPassword ? 'text' : 'password'}
                                            className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition-all pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 focus:outline-none transition-colors"
                                        >
                                            {showNewPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            {...registerPassword('confirmPassword', { required: true })}
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            className="w-full px-4 py-2 bg-secondary-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition-all pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 focus:outline-none transition-colors"
                                        >
                                            {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {passwordError && (
                                <p className="text-red-500 text-sm flex items-center gap-1 mt-2">
                                    <AlertCircle size={16} /> {passwordError}
                                </p>
                            )}

                            <div className="flex items-center justify-between pt-4">
                                {passwordSuccess && (
                                    <span className="text-emerald-600 text-sm flex items-center gap-1">
                                        <CheckCircle2 size={16} /> Password changed!
                                    </span>
                                )}
                                <div className="ml-auto">
                                    <button
                                        type="submit"
                                        disabled={changePasswordMutation.isPending}
                                        className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all disabled:opacity-50"
                                    >
                                        {changePasswordMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
