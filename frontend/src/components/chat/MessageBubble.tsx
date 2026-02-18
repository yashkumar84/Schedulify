import React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

interface Message {
    _id: string;
    sender: {
        _id: string;
        name: string;
        role: string;
    };
    content: string;
    type: 'text' | 'system' | 'file';
    createdAt: string;
}

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
                    className={`px-4 py-2 rounded-2xl ${isOwnMessage
                            ? 'bg-primary-600 text-white rounded-br-sm'
                            : 'bg-secondary-100 text-foreground rounded-bl-sm'
                        }`}
                >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
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
