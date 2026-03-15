import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Loader2, ArrowLeft, Clock, Users } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import OnlineUsers from './OnlineUsers';
import { useTeam, useRecentChats } from '../../hooks/useApi';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
    const { projectId, projectName, receiverId, receiverName } = useChatStore();
    const [chatMode, setChatMode] = useState<'project' | 'personal'>('project');
    const [selectedUser, setSelectedUser] = useState<{ id: string, name: string } | null>(null);

    // Sync local state with store when opened/changed
    useEffect(() => {
        if (isOpen) {
            useChatStore.getState().setHasUnreadMessages(false);
        }

        if (projectId) {
            setChatMode('project');
            setSelectedUser(null);
        } else if (receiverId) {
            setChatMode('personal');
            // Only update selectedUser if it's different to prevent name switching mid-chat
            if (!selectedUser || selectedUser.id !== receiverId) {
                setSelectedUser({ id: receiverId, name: receiverName || 'User' });
            }
        } else if (isOpen) {
            setChatMode('personal');
            setSelectedUser(null);
        }
    }, [projectId, receiverId, receiverName, isOpen, selectedUser]);

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
    const { data: recentChats } = useRecentChats();
    const { user } = useAuthStore();
    const canSeeTeam = user?.role === 'SUPER_ADMIN' || user?.permissions?.team?.read;

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
                    <div className="flex items-center justify-between p-4 min-h-[64px]">
                        <div className="flex items-center gap-3 overflow-hidden">
                            {chatMode === 'personal' && selectedUser ? (
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
                                    aria-label="Back to contacts"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                            ) : (
                                <div className="p-2 -ml-2 bg-white/10 rounded-xl shrink-0">
                                    <MessageCircle size={20} />
                                </div>
                            )}
                            <div className="min-w-0">
                                <h3 className="font-bold text-sm truncate leading-tight">
                                    {chatMode === 'project' ? projectName : (selectedUser ? selectedUser.name : 'Team Conversations')}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {isConnected ? (
                                        <>
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                                            <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Live</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                            <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Connecting...</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 -mr-2 rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
                            aria-label="Close chat"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Mode Toggle - only if we have a project context */}
                    {!selectedUser && projectId && (
                        <div className="flex px-4 pb-3 gap-1">
                            <button
                                onClick={() => setChatMode('project')}
                                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all uppercase tracking-widest ${chatMode === 'project' ? 'bg-white text-primary-600 shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                            >
                                Project Feed
                            </button>
                            <button
                                onClick={() => setChatMode('personal')}
                                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all uppercase tracking-widest ${chatMode === 'personal' ? 'bg-white text-primary-600 shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                            >
                                Direct Messages
                            </button>
                        </div>
                    )}
                </div>

                {/* Online Users (only for project chat) */}
                {chatMode === 'project' && (
                    <OnlineUsers
                        users={onlineUsers}
                        onUserClick={(id, name) => {
                            setChatMode('personal');
                            setSelectedUser({ id, name });
                        }}
                    />
                )}

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
                        <div className="p-4 space-y-4 relative z-10">
                            {recentChats && recentChats.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Clock size={12} />
                                        Recent Conversations
                                    </h4>
                                    <div className="space-y-2">
                                        {recentChats.map((chat: any) => (
                                            <button
                                                key={chat._id}
                                                onClick={() => setSelectedUser({ id: chat._id, name: chat.name })}
                                                className="w-full flex items-center gap-3 p-3 bg-secondary-50/50 border border-border rounded-xl hover:border-primary-600 hover:bg-white transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                                                    {chat.name.charAt(0)}
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <p className="text-sm font-bold truncate">{chat.name}</p>
                                                        <span className="text-[9px] text-secondary-400">
                                                            {new Date(chat.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-secondary-500 truncate italic">"{chat.lastMessage}"</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {canSeeTeam && teamMembers && teamMembers.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest mb-3">All Team Members</h4>
                                    <div className="space-y-2">
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
                                                    <p className="text-[10px] text-secondary-500 uppercase tracking-tighter">{member.role.replace('_', ' ')}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!canSeeTeam && (!recentChats || recentChats.length === 0) && (
                                <div className="text-center py-10 px-4">
                                    <Users size={40} className="mx-auto text-secondary-300 mb-3" />
                                    <p className="text-sm font-medium text-secondary-600">No active conversations</p>
                                    <p className="text-xs text-secondary-400 mt-1">
                                        Wait for a team member or admin to message you to start a chat.
                                    </p>
                                </div>
                            )}
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
