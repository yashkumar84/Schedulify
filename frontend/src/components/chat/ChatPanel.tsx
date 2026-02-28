import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Loader2 } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import OnlineUsers from './OnlineUsers';

interface ChatPanelProps {
    projectId: string;
    projectName: string;
    isOpen: boolean;
    onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ projectId, projectName, isOpen, onClose }) => {
    const { messages, onlineUsers, typingUsers, isConnected, isLoading, sendMessage, sendTyping, uploadFile } = useChat(projectId);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-screen w-full md:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-primary-600 text-white">
                    <div className="flex items-center gap-2">
                        <MessageCircle size={20} />
                        <div>
                            <h3 className="font-semibold text-sm">{projectName}</h3>
                            <p className="text-xs opacity-90">
                                {isConnected ? (
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                        Connected
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                        Connecting...
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Online Users */}
                <OnlineUsers users={onlineUsers} />

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-background relative chat-container">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            backgroundSize: '100px 100px'
                        }}
                    />

                    <div className="relative z-10 box-border">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="animate-spin text-primary-600" size={32} />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                <MessageCircle size={48} className="text-secondary-300 mb-3" />
                                <p className="text-secondary-500 font-medium">No messages yet</p>
                                <p className="text-xs text-secondary-400 mt-1">Start the conversation!</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((message) => (
                                    <MessageBubble key={message._id} message={message} />
                                ))}
                                <div ref={messagesEndRef} />
                            </>
                        )}

                        {/* Typing Indicator */}
                        {typingUsers.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-secondary-500 italic mb-2 ml-2">
                                <div className="flex gap-1">
                                    <span className="w-1 h-1 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-1 h-1 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-1 h-1 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                                <span>{typingUsers.join(', ')} typing...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input */}
                <ChatInput
                    onSendMessage={sendMessage}
                    onUploadFile={uploadFile}
                    onTyping={sendTyping}
                    disabled={!isConnected}
                />
            </motion.div>
        </AnimatePresence>
    );
};

export default ChatPanel;
