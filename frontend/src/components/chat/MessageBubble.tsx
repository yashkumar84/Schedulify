import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, File as FileIcon, Music, Play, Pencil, Check, X, ZoomIn } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Message } from '../../hooks/useChat';

interface MessageBubbleProps {
    message: Message;
    onEdit?: (messageId: string, newContent: string) => void;
}

// --- WhatsApp-style image lightbox ---
const ImageLightbox: React.FC<{ src: string; alt?: string; onClose: () => void }> = ({ src, alt, onClose }) => {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = src;
        link.download = alt || 'image';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col"
            onClick={onClose}
        >
            {/* Top toolbar */}
            <div className="flex items-center justify-between px-4 py-3 z-10" onClick={e => e.stopPropagation()}>
                <p className="text-white/70 text-sm truncate max-w-xs">{alt || 'Image'}</p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                        <Download size={14} /> Download
                    </button>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Image centred */}
            <div
                className="flex-1 flex items-center justify-center p-4"
                onClick={e => e.stopPropagation()}
            >
                <img
                    src={src}
                    alt={alt}
                    className="max-w-full max-h-full object-contain rounded-xl select-none"
                    draggable={false}
                />
            </div>
        </motion.div>
    );
};

// --- Edit Input ---
const EditInput: React.FC<{ initial: string; onSave: (v: string) => void; onCancel: () => void }> = ({ initial, onSave, onCancel }) => {
    const [value, setValue] = useState(initial);
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        ref.current?.focus();
        ref.current?.setSelectionRange(value.length, value.length);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSave(value); }
        if (e.key === 'Escape') onCancel();
    };

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <textarea
                ref={ref}
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                className="w-full bg-white/20 text-white placeholder-white/50 rounded-xl px-3 py-2 text-sm outline-none resize-none border border-white/30 focus:border-white/60"
            />
            <div className="flex justify-end gap-1.5">
                <button onClick={onCancel} className="flex items-center gap-1 text-[11px] font-semibold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors">
                    <X size={12} /> Cancel
                </button>
                <button onClick={() => onSave(value)} disabled={!value.trim()} className="flex items-center gap-1 text-[11px] font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 px-2 py-1 rounded-lg transition-colors">
                    <Check size={12} /> Save
                </button>
            </div>
            <p className="text-[10px] text-white/40 text-right">Enter to save · Esc to cancel</p>
        </div>
    );
};

// --- Main component ---
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onEdit }) => {
    const { user } = useAuthStore();
    const isOwnMessage = message.sender._id === (user as any)?._id || message.sender._id === (user as any)?.id;
    const isSystemMessage = message.type === 'system';

    const [isEditing, setIsEditing] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [showActions, setShowActions] = useState(false);

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const formatTime = (dateString: string) =>
        new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const handleSaveEdit = (newContent: string) => {
        if (onEdit && newContent.trim() && newContent !== message.content) {
            onEdit(message._id, newContent.trim());
        }
        setIsEditing(false);
    };

    if (isSystemMessage) {
        return (
            <div className="flex justify-center my-3">
                <span className="text-[10px] uppercase tracking-wider font-bold text-secondary-500 bg-secondary-100/50 backdrop-blur-sm px-3 py-1 rounded-full border border-secondary-200/50">
                    {message.content}
                </span>
            </div>
        );
    }

    return (
        <>
            {/* Image Lightbox */}
            <AnimatePresence>
                {lightboxSrc && (
                    <ImageLightbox
                        src={lightboxSrc}
                        alt={message.metadata?.fileName}
                        onClose={() => setLightboxSrc(null)}
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`flex gap-2 mb-4 group ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                onMouseEnter={() => setShowActions(true)}
                onMouseLeave={() => { if (!isEditing) setShowActions(false); }}
            >
                {/* Avatar */}
                {!isOwnMessage && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-sm border-2 border-white">
                        {getInitials(message.sender.name)}
                    </div>
                )}

                {/* Message Content Container */}
                <div className={`flex flex-col relative max-w-[85%] sm:max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    {!isOwnMessage && (
                        <span className="text-[11px] text-primary-600 font-bold mb-0.5 px-2 ml-1">
                            {message.sender.name}
                        </span>
                    )}

                    <div
                        className={`relative px-3 py-2 shadow-sm transition-all ${isOwnMessage
                            ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-2xl rounded-tr-none'
                            : 'bg-white text-secondary-900 rounded-2xl rounded-tl-none border border-secondary-100'
                            }`}
                    >
                        {/* Tail */}
                        <div
                            className={`absolute top-0 w-3 h-3 ${isOwnMessage
                                ? '-right-1 bg-primary-500 [clip-path:polygon(0_0,100%_0,0_100%)]'
                                : '-left-1 bg-white border-l border-t border-secondary-100 [clip-path:polygon(0_0,100%_0,100%_100%)]'}`}
                        />

                        {/* TEXT */}
                        {message.type === 'text' && (
                            isEditing ? (
                                <EditInput
                                    initial={message.content}
                                    onSave={handleSaveEdit}
                                    onCancel={() => setIsEditing(false)}
                                />
                            ) : (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-2 line-clamp-[20]">
                                    {message.content}
                                </p>
                            )
                        )}

                        {/* IMAGE — click to open lightbox */}
                        {message.type === 'image' && message.metadata?.fileUrl && (
                            <div className="relative group/media mt-0.5 -mx-1 -my-1 rounded-xl overflow-hidden bg-black/5">
                                <img
                                    src={message.metadata.fileUrl}
                                    alt={message.metadata.fileName}
                                    className="max-w-full max-h-[300px] object-cover rounded-lg cursor-pointer hover:brightness-90 transition-all duration-200"
                                    loading="lazy"
                                    onClick={() => setLightboxSrc(message.metadata!.fileUrl!)}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/10 flex items-center justify-center transition-colors pointer-events-none rounded-xl">
                                    <ZoomIn className="text-white opacity-0 group-hover/media:opacity-100 transition-opacity drop-shadow-lg" size={28} />
                                </div>
                                {message.content && message.content !== message.metadata.fileName && (
                                    <p className="mt-2 px-1 pb-1 text-sm">{message.content}</p>
                                )}
                            </div>
                        )}

                        {/* VIDEO */}
                        {message.type === 'video' && message.metadata?.fileUrl && (
                            <div className="mt-1 -mx-1 -my-1 relative group/media overflow-hidden rounded-xl bg-black min-w-[200px]">
                                <video className="max-w-full rounded-lg" src={message.metadata.fileUrl} />
                                <div
                                    className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer hover:bg-black/40 transition-colors"
                                    onClick={() => window.open(message.metadata?.fileUrl, '_blank')}
                                >
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                                        <Play fill="currentColor" size={20} className="ml-1" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AUDIO */}
                        {message.type === 'audio' && message.metadata?.fileUrl && (
                            <div className={`mt-1 p-2 rounded-xl min-w-[200px] ${isOwnMessage ? 'bg-white/10' : 'bg-secondary-50'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Music size={14} className={isOwnMessage ? 'text-white/80' : 'text-primary-600'} />
                                    <span className={`text-[10px] font-medium truncate ${isOwnMessage ? 'text-white/80' : 'text-secondary-600'}`}>
                                        {message.metadata.fileName}
                                    </span>
                                </div>
                                <audio controls className="w-full h-8" src={message.metadata.fileUrl} />
                            </div>
                        )}

                        {/* FILE */}
                        {message.type === 'file' && message.metadata?.fileUrl && (
                            <a
                                href={message.metadata.fileUrl}
                                download={message.metadata.fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all border ${isOwnMessage
                                    ? 'bg-white/10 hover:bg-white/20 border-white/10'
                                    : 'bg-secondary-50 hover:bg-secondary-100 border-secondary-200'
                                    }`}
                            >
                                <div className={`p-2.5 rounded-xl ${isOwnMessage ? 'bg-white/20' : 'bg-primary-100'}`}>
                                    <FileIcon size={20} className={isOwnMessage ? 'text-white' : 'text-primary-600'} />
                                </div>
                                <div className="flex-1 min-w-0 mr-4">
                                    <p className={`text-sm font-bold truncate ${isOwnMessage ? 'text-white' : 'text-secondary-900'}`}>
                                        {message.metadata.fileName}
                                    </p>
                                    <p className={`text-[10px] font-medium ${isOwnMessage ? 'text-white/70' : 'text-secondary-500'}`}>
                                        {message.metadata.fileSize ? (message.metadata.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'}
                                    </p>
                                </div>
                                <Download size={18} className={`flex-shrink-0 ${isOwnMessage ? 'text-white/70' : 'text-secondary-400'}`} />
                            </a>
                        )}

                        {/* Timestamp + Edited badge */}
                        <div className={`flex items-center gap-1.5 mt-1 justify-end ${isOwnMessage ? 'text-white/60' : 'text-secondary-400'}`}>
                            {message.isEdited && (
                                <span className={`text-[9px] italic ${isOwnMessage ? 'text-white/50' : 'text-secondary-400'}`}>edited</span>
                            )}
                            <span className="text-[9px] font-medium">{formatTime(message.createdAt)}</span>
                        </div>
                    </div>

                    {/* Edit action button (own text messages only) */}
                    {isOwnMessage && message.type === 'text' && !isEditing && onEdit && (
                        <AnimatePresence>
                            {showActions && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => setIsEditing(true)}
                                    className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary-100 hover:bg-primary-100 text-secondary-400 hover:text-primary-600 flex items-center justify-center transition-colors shadow-sm"
                                    title="Edit message"
                                >
                                    <Pencil size={11} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    )}
                </div>

                {/* Own Avatar */}
                {isOwnMessage && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-sm border-2 border-white">
                        {getInitials((user as any)?.name || 'You')}
                    </div>
                )}
            </motion.div>
        </>
    );
};

export default MessageBubble;
