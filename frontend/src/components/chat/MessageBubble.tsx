import React from 'react';
import { motion } from 'framer-motion';
import { Download, File, Music } from 'lucide-react';
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
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    if (isSystemMessage) {
        return (
            <div className="flex justify-center my-2">
                <span className="text-xs text-secondary-400 bg-secondary-50 px-3 py-1 rounded-full">
                    {message.content}
                </span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 mb-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {/* Avatar */}
            {!isOwnMessage && (
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {getInitials(message.sender.name)}
                </div>
            )}

            {/* Message Content */}
            <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                {!isOwnMessage && (
                    <span className="text-xs text-secondary-500 font-medium mb-1 px-1">
                        {message.sender.name}
                    </span>
                )}
                <div
                    className={`px-4 py-2 rounded-2xl overflow-hidden ${isOwnMessage
                        ? 'bg-primary-600 text-white rounded-br-sm'
                        : 'bg-secondary-100 text-foreground rounded-bl-sm'
                        }`}
                >
                    {message.type === 'text' && (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    )}

                    {message.type === 'image' && message.metadata?.fileUrl && (
                        <div className="space-y-2">
                            <img
                                src={message.metadata.fileUrl}
                                alt={message.metadata.fileName}
                                className="max-w-full rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => window.open(message.metadata?.fileUrl, '_blank')}
                            />
                            {message.content && message.content !== message.metadata.fileName && (
                                <p className="text-sm">{message.content}</p>
                            )}
                        </div>
                    )}

                    {message.type === 'video' && message.metadata?.fileUrl && (
                        <div className="space-y-2 min-w-[240px]">
                            <video
                                controls
                                className="max-w-full rounded-lg"
                                src={message.metadata.fileUrl}
                            />
                            <p className="text-xs font-medium truncate">{message.metadata.fileName}</p>
                        </div>
                    )}

                    {message.type === 'audio' && message.metadata?.fileUrl && (
                        <div className="space-y-2 min-w-[240px]">
                            <div className="flex items-center gap-2 mb-1">
                                <Music size={14} />
                                <span className="text-xs font-medium truncate">{message.metadata.fileName}</span>
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
                            className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${isOwnMessage ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-secondary-50'
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${isOwnMessage ? 'bg-white/20' : 'bg-primary-50'}`}>
                                <File size={20} className={isOwnMessage ? 'text-white' : 'text-primary-600'} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${isOwnMessage ? 'text-white' : 'text-secondary-900'}`}>
                                    {message.metadata.fileName}
                                </p>
                                <p className={`text-[10px] ${isOwnMessage ? 'text-white/70' : 'text-secondary-500'}`}>
                                    {message.metadata.fileSize ? (message.metadata.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'}
                                </p>
                            </div>
                            <Download size={18} className={isOwnMessage ? 'text-white/70' : 'text-secondary-400'} />
                        </a>
                    )}
                </div>
                <span className="text-[10px] text-secondary-400 mt-1 px-1">
                    {formatTime(message.createdAt)}
                </span>
            </div>

            {/* Own Avatar */}
            {isOwnMessage && (
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {getInitials((user as any)?.name || 'You')}
                </div>
            )}
        </motion.div>
    );
};

export default MessageBubble;
