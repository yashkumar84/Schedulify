import React from 'react';
import { motion } from 'framer-motion';
import { Download, File as FileIcon, Music, Play, Eye } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Message } from '../../hooks/useChat';

interface MessageBubbleProps {
    message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const { user } = useAuthStore();
    const isOwnMessage = message.sender._id === (user as any)?._id || message.sender._id === (user as any)?.id;
    const isSystemMessage = message.type === 'system';

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
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
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`flex gap-2 mb-4 group ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
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

                    {message.type === 'text' && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-2 line-clamp-[20]">
                            {message.content}
                        </p>
                    )}

                    {message.type === 'image' && message.metadata?.fileUrl && (
                        <div className="relative group/media mt-0.5 -mx-1 -my-1 rounded-xl overflow-hidden bg-black/5">
                            <img
                                src={message.metadata.fileUrl}
                                alt={message.metadata.fileName}
                                className="max-w-full max-h-[300px] object-cover rounded-lg cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                                loading="lazy"
                                onClick={() => window.open(message.metadata?.fileUrl, '_blank')}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/10 flex items-center justify-center transition-colors pointer-events-none">
                                <Eye className="text-white opacity-0 group-hover/media:opacity-100 transition-opacity drop-shadow-lg" size={24} />
                            </div>
                            {message.content && message.content !== message.metadata.fileName && (
                                <p className="mt-2 px-1 pb-1 text-sm">{message.content}</p>
                            )}
                        </div>
                    )}

                    {message.type === 'video' && message.metadata?.fileUrl && (
                        <div className="mt-1 -mx-1 -my-1 relative group/media overflow-hidden rounded-xl bg-black min-w-[200px]">
                            <video
                                className="max-w-full rounded-lg"
                                src={message.metadata.fileUrl}
                            />
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

                    {message.type === 'audio' && message.metadata?.fileUrl && (
                        <div className={`mt-1 p-2 rounded-xl min-w-[200px] ${isOwnMessage ? 'bg-white/10' : 'bg-secondary-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Music size={14} className={isOwnMessage ? 'text-white/80' : 'text-primary-600'} />
                                <span className={`text-[10px] font-medium truncate ${isOwnMessage ? 'text-white/80' : 'text-secondary-600'}`}>
                                    {message.metadata.fileName}
                                </span>
                            </div>
                            <audio
                                controls
                                className="w-full h-8"
                                src={message.metadata.fileUrl}
                            />
                        </div>
                    )}

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

                    {/* Meta info inside bubble (WhatsApp style) */}
                    <div className={`flex items-center gap-1 mt-1 justify-end ${isOwnMessage ? 'text-white/70' : 'text-secondary-400'}`}>
                        <span className="text-[9px] font-medium">
                            {formatTime(message.createdAt)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Own Avatar (Hidden in many modern designs, but keeping for consistency if requested) */}
            {isOwnMessage && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-sm border-2 border-white">
                    {getInitials((user as any)?.name || 'You')}
                </div>
            )}
        </motion.div>
    );
};

export default MessageBubble;
