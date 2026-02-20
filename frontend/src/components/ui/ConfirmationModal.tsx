import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = true,
    isLoading = false
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 relative"
                    >
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 text-secondary-400 hover:text-secondary-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isDestructive ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-600'
                                }`}>
                                <AlertTriangle size={24} />
                            </div>
                            <div className="flex-1 pt-1">
                                <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
                                <p className="text-secondary-500 text-sm leading-relaxed">{message}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-8">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-5 py-2.5 rounded-xl font-semibold border border-border hover:bg-secondary-50 transition-colors text-sm"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`px-5 py-2.5 rounded-xl font-semibold text-white transition-all shadow-lg text-sm flex items-center gap-2 ${isDestructive
                                        ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                                        : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20'
                                    }`}
                            >
                                {isLoading && <Loader2 size={16} className="animate-spin" />}
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;
