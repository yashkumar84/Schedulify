import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordForm) => {
        setLoading(true);
        setError(null);
        try {
            await api.post('/auth/forgot-password', data);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-8 bg-card p-6 sm:p-10 rounded-2xl shadow-xl border border-border"
            >
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                        <KeyRound size={32} />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        Forgot Password?
                    </h2>
                    <p className="mt-2 text-sm text-secondary-500">
                        No worries, we'll send you reset instructions.
                    </p>
                </div>

                {success ? (
                    <div className="space-y-6">
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                            <p className="text-emerald-700 font-medium">Reset instructions sent!</p>
                            <p className="text-emerald-600 text-sm mt-1">Please check your email for the reset code.</p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-all outline-none"
                        >
                            Return to Login
                        </button>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                                {error}
                            </div>
                        )}

                        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700">Email Address</label>
                                <div className="relative mt-1">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        {...register('email')}
                                        type="email"
                                        className={`block w-full pl-10 pr-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-input'} bg-background focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none`}
                                        placeholder="name@company.com"
                                    />
                                </div>
                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Reset Password'}
                            </button>

                            <div className="text-center mt-4">
                                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-secondary-500 hover:text-primary-600 transition-colors font-medium">
                                    <ArrowLeft size={16} />
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
