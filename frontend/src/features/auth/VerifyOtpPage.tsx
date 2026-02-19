import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const verifyOtpSchema = z.object({
    otp: z.string().length(6, 'Verification code must be 6 digits'),
});

type VerifyOtpForm = z.infer<typeof verifyOtpSchema>;

const VerifyOtpPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<VerifyOtpForm>({
        resolver: zodResolver(verifyOtpSchema),
    });

    const onSubmit = async (data: VerifyOtpForm) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/verify-otp', { email, otp: data.otp });
            navigate('/reset-password', { state: { email, token: response.data.token } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid verification code');
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
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        Verify OTP
                    </h2>
                    <p className="mt-2 text-sm text-secondary-500">
                        We've sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>
                    </p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200 text-center">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 text-center mb-4">
                            Enter 6-digit code
                        </label>
                        <input
                            {...register('otp')}
                            type="text"
                            maxLength={6}
                            className={`block w-full text-center text-3xl tracking-[1em] font-bold py-4 rounded-xl border ${errors.otp ? 'border-red-500' : 'border-input'} bg-background focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none`}
                            placeholder="000000"
                        />
                        {errors.otp && <p className="mt-2 text-xs text-red-500 text-center">{errors.otp.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verify Code'}
                    </button>

                    <div className="text-center mt-4">
                        <Link to="/forgot-password" className="inline-flex items-center gap-2 text-sm text-secondary-500 hover:text-primary-600 transition-colors font-medium">
                            <ArrowLeft size={16} />
                            Change email
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default VerifyOtpPage;
