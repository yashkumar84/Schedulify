import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const resetPasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    const token = location.state?.token;

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    React.useEffect(() => {
        if (!email || !token) {
            navigate('/forgot-password');
        }
    }, [email, token, navigate]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordForm) => {
        setLoading(true);
        setError(null);
        try {
            await api.post('/auth/reset-password', { email, token, password: data.password });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md text-center space-y-6 bg-card p-10 rounded-2xl shadow-xl border border-border"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 text-primary-600 mb-4">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground">Password Reset!</h2>
                    <p className="text-secondary-500">
                        Your password has been successfully updated. Redirecting you to login...
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-8 bg-card p-6 sm:p-10 rounded-2xl shadow-xl border border-border"
            >
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        Set New Password
                    </h2>
                    <p className="mt-2 text-sm text-secondary-500">
                        Please enter your new password below.
                    </p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200 text-center">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">New Password</label>
                            <div className="relative mt-1">
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    className={`block w-full px-4 py-3 rounded-xl border ${errors.password ? 'border-red-500' : 'border-input'} bg-background focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none pr-12`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 focus:outline-none transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Confirm Password</label>
                            <div className="relative mt-1">
                                <input
                                    {...register('confirmPassword')}
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className={`block w-full px-4 py-3 rounded-xl border ${errors.confirmPassword ? 'border-red-500' : 'border-input'} bg-background focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none pr-12`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 focus:outline-none transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Reset Password'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;
