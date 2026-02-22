import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const colors = {
        success: 'bg-emerald-500 text-white',
        error: 'bg-rose-500 text-white',
        info: 'bg-primary-500 text-white',
    };

    const icons = {
        success: <CheckCircle2 size={20} />,
        error: <AlertCircle size={20} />,
        info: <Info size={20} />,
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl ${colors[type]}`}
        >
            {icons[type]}
            <p className="text-sm font-bold tracking-tight">{message}</p>
            <button
                onClick={onClose}
                className="ml-2 hover:bg-white/20 p-1 rounded-lg transition-colors"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

export default Toast;
