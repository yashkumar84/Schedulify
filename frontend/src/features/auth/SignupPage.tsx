import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useRegister } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { UserPlus, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupForm = z.infer<typeof signupSchema>;

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const registerMutation = useRegister();
    const [error, setError] = React.useState<string | null>(null);
    const [showPassword, setShowPassword] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupForm>({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = async (data: SignupForm) => {
        setError(null);
        registerMutation.mutate(data, {
            onSuccess: (response) => {
                // If the backend returns user and token on register
                if (response.data.user && response.data.token) {
                    login(response.data.user, response.data.token);
                    navigate('/dashboard');
                } else {
                    // Otherwise, redirect to login
                    navigate('/login', { state: { message: 'Registration successful! Please login.' } });
                }
            },
            onError: (err: any) => {
                setError(err.response?.data?.message || 'Registration failed');
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-8 bg-card p-6 sm:p-10 rounded-2xl shadow-xl border border-border"
            >
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                        <UserPlus size={32} />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        Create Account
                    </h2>
                    <p className="mt-2 text-sm text-secondary-500">
                        Join TaskiFy to start managing your projects
                    </p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Full Name</label>
                            <input
                                {...register('name')}
                                type="text"
                                className={`mt-1 block w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500' : 'border-input'} bg-background focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none`}
                                placeholder="John Doe"
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Email Address</label>
                            <input
                                {...register('email')}
                                type="email"
                                className={`mt-1 block w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-input'} bg-background focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none`}
                                placeholder="name@company.com"
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Password</label>
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

                    </div>

                    <button
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 mt-4"
                    >
                        {registerMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
                    </button>

                    <div className="text-center pt-2">
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-secondary-500 hover:text-primary-600 transition-colors font-medium">
                            <ArrowLeft size={16} />
                            Already have an account? Sign In
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default SignupPage;
