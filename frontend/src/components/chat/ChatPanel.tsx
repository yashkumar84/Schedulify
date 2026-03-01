import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import OnlineUsers from './OnlineUsers';
import { useTeam } from '../../hooks/useApi';

interface ChatPanelProps {
    projectId: string;
    projectName: string;
    isOpen: boolean;
    onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ projectId, projectName, isOpen, onClose }) => {
    const [chatMode, setChatMode] = useState<'project' | 'personal'>('project');
    const [selectedUser, setSelectedUser] = useState<{ id: string, name: string } | null>(null);

    const {
        messages,
        onlineUsers,
        typingUsers,
        isConnected,
        isLoading,
        sendMessage,
        sendTyping,
        uploadFile,
        editMessage
    } = useChat(
        chatMode === 'project' ? projectId : undefined,
        chatMode === 'personal' && selectedUser ? selectedUser.id : undefined
    );

    const { data: teamMembers } = useTeam();
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
                <div className="flex flex-col border-b border-border bg-primary-600 text-white">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-2">
                            {chatMode === 'personal' && selectedUser ? (
                                <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors mr-1">
                                    <ArrowLeft size={18} />
                                </button>
                            ) : (
                                <MessageCircle size={20} />
                            )}
                            <div>
                                <h3 className="font-semibold text-sm">
                                    {chatMode === 'project' ? projectName : (selectedUser ? selectedUser.name : 'Personal Chat')}
                                </h3>
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

                    {/* Mode Toggle */}
                    {!selectedUser && (
                        <div className="flex px-4 pb-2 gap-4">
                            <button
                                onClick={() => setChatMode('project')}
                                className={`text-xs font-bold pb-1 border-b-2 transition-all ${chatMode === 'project' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}
                            >
                                Project
                            </button>
                            <button
                                onClick={() => setChatMode('personal')}
                                className={`text-xs font-bold pb-1 border-b-2 transition-all ${chatMode === 'personal' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}
                            >
                                Personal
                            </button>
                        </div>
                    )}
                </div>

                {/* Online Users (only for project chat) */}
                {chatMode === 'project' && <OnlineUsers users={onlineUsers} />}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-background relative chat-container flex flex-col">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            backgroundSize: '100px 100px'
                        }}
                    />

                    {chatMode === 'personal' && !selectedUser ? (
                        /* User List for Personal Chat */
                        <div className="p-4 space-y-2 relative z-10">
                            <h4 className="text-xs font-bold text-secondary-500 uppercase tracking-widest mb-4">Select Team Member</h4>
                            {teamMembers?.map((member: any) => (
                                <button
                                    key={member._id}
                                    onClick={() => setSelectedUser({ id: member._id, name: member.name })}
                                    className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary-600 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 font-bold group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold">{member.name}</p>
                                        <p className="text-xs text-secondary-500">{member.role.replace('_', ' ')}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* Message List */
                        <div className="p-4 relative z-10 flex-1 flex flex-col">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full flex-1">
                                    <Loader2 className="animate-spin text-primary-600" size={32} />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center flex-1 text-center py-20">
                                    <MessageCircle size={48} className="text-secondary-300 mb-3" />
                                    <p className="text-secondary-500 font-medium">No messages yet</p>
                                    <p className="text-xs text-secondary-400 mt-1">Start the conversation!</p>
                                </div>
                            ) : (
                                <>
                                    {messages.map((message) => (
                                        <MessageBubble key={message._id} message={message} onEdit={editMessage} />
                                    ))}
                                    <div ref={messagesEndRef} />
                                </>
                            )}

                            {/* Typing Indicator */}
                            {typingUsers.length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-secondary-500 italic mt-auto mb-2 ml-2">
                                    <div className="flex gap-1">
                                        <span className="w-1 h-1 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-1 h-1 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-1 h-1 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                    <span>{typingUsers.join(', ')} typing...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Input (only when context is clear) */}
                {(chatMode === 'project' || (chatMode === 'personal' && selectedUser)) && (
                    <ChatInput
                        onSendMessage={sendMessage}
                        onUploadFile={uploadFile}
                        onTyping={sendTyping}
                        disabled={!isConnected}
                    />
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default ChatPanel;
