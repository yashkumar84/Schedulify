import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../utils/socket';
import api from '../utils/api';

export interface Message {
    _id: string;
    project?: string;
    receiver?: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    sender: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    content: string;
    type: 'text' | 'system' | 'file' | 'image' | 'video' | 'audio';
    metadata?: {
        fileName?: string;
        fileUrl?: string;
        fileSize?: number;
        mimetype?: string;
    };
    isEdited?: boolean;
    editedAt?: string;
    createdAt: string;
    updatedAt: string;
}

interface OnlineUser {
    userId: string;
    userName: string;
    userRole: string;
}

export const useChat = (projectId?: string, receiverId?: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const socketRef = useRef(getSocket());
    const typingTimeoutRef = useRef<number | null>(null);

    const onlineUsersRef = useRef<OnlineUser[]>([]);

    // Update ref whenever state changes
    useEffect(() => {
        onlineUsersRef.current = onlineUsers;
    }, [onlineUsers]);

    // Load message history
    const loadMessages = useCallback(async () => {
        try {
            setIsLoading(true);
            let url = '';
            if (projectId) {
                url = `/chat/${projectId}/messages?limit=50`;
            } else if (receiverId) {
                url = `/chat/personal/${receiverId}?limit=50`;
            }

            if (url) {
                const response = await api.get(url);
                setMessages(response.data.messages);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, receiverId]);

    // Send message
    const sendMessage = useCallback((content: string, type: string = 'text', metadata: any = null) => {
        const socket = socketRef.current;
        if (socket && (content.trim() || metadata)) {
            socket.emit('send-message', {
                projectId,
                receiverId,
                content: content.trim(),
                type,
                metadata
            });
        }
    }, [projectId, receiverId]);

    // Upload file
    const uploadFile = useCallback(async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }, []);

    // Send typing indicator
    const sendTyping = useCallback(() => {
        const socket = socketRef.current;
        if (socket) {
            const payload = projectId ? { projectId } : { receiverId };
            socket.emit('typing', payload);

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = window.setTimeout(() => {
                socket.emit('stop-typing', payload);
            }, 2000);
        }
    }, [projectId, receiverId]);

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        // Join appropriate room
        if (projectId) {
            socket.emit('join-project', projectId);
        }
        setIsConnected(true);

        // Load initial messages
        loadMessages();

        // Socket event listeners
        const handleNewMessage = (message: Message) => {
            // Only add message if it belongs to current context
            if (projectId && message.project === projectId) {
                setMessages(prev => [...prev, message]);
            } else if (receiverId) {
                // In personal chat, message payload has receiver and sender
                const matches = (message.sender._id === receiverId) || (message.receiver?._id === receiverId);
                if (matches && !message.project) {
                    setMessages(prev => [...prev, message]);
                }
            }
        };

        const handleOnlineUsers = (users: OnlineUser[]) => {
            if (projectId) setOnlineUsers(users);
        };

        const handleUserJoined = (user: OnlineUser) => {
            if (projectId) {
                setOnlineUsers(prev => {
                    const exists = prev.some(u => u.userId === user.userId);
                    if (exists) return prev;
                    return [...prev, user];
                });
            }
        };

        const handleUserLeft = (data: { userId: string }) => {
            if (projectId) setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
        };

        const handleUserTyping = (data: { userId: string; userName: string; isPersonal?: boolean }) => {
            if (projectId && !data.isPersonal) {
                setTypingUsers(prev => new Set(prev).add(data.userName));
            } else if (receiverId && data.isPersonal && data.userId === receiverId) {
                setTypingUsers(prev => new Set(prev).add(data.userName));
            }
        };

        const handleUserStopTyping = (data: { userId: string; isPersonal?: boolean }) => {
            if (projectId && !data.isPersonal) {
                setTypingUsers(prev => {
                    const newSet = new Set(prev);
                    const user = onlineUsersRef.current.find(u => u.userId === data.userId);
                    if (user) newSet.delete(user.userName);
                    return newSet;
                });
            } else if (receiverId && data.isPersonal && data.userId === receiverId) {
                setTypingUsers(new Set()); // Simplify for personal, only one other person
            }
        };

        const handleMessageEdited = (data: { _id: string; content: string; isEdited: boolean; editedAt: string }) => {
            setMessages(prev => prev.map(m =>
                m._id === data._id ? { ...m, content: data.content, isEdited: data.isEdited, editedAt: data.editedAt } : m
            ));
        };

        socket.on('new-message', handleNewMessage);
        socket.on('message-edited', handleMessageEdited);
        socket.on('online-users', handleOnlineUsers);
        socket.on('user-joined', handleUserJoined);
        socket.on('user-left', handleUserLeft);
        socket.on('user-typing', handleUserTyping);
        socket.on('user-stop-typing', handleUserStopTyping);

        // Cleanup
        return () => {
            if (projectId) socket.emit('leave-project', projectId);
            socket.off('new-message', handleNewMessage);
            socket.off('message-edited', handleMessageEdited);
            socket.off('online-users', handleOnlineUsers);
            socket.off('user-joined', handleUserJoined);
            socket.off('user-left', handleUserLeft);
            socket.off('user-typing', handleUserTyping);
            socket.off('user-stop-typing', handleUserStopTyping);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [projectId, receiverId, loadMessages]);

    // Edit a message via API
    const editMessage = useCallback(async (messageId: string, content: string) => {
        try {
            const response = await api.put(`/chat/messages/${messageId}`, { content });
            // Update locally (socket event will also handle it)
            setMessages(prev => prev.map(m =>
                m._id === messageId ? { ...m, content: response.data.content, isEdited: true, editedAt: response.data.editedAt } : m
            ));
        } catch (error) {
            console.error('Error editing message:', error);
            throw error;
        }
    }, []);

    return {
        messages,
        onlineUsers,
        typingUsers: Array.from(typingUsers),
        isConnected,
        isLoading,
        sendMessage,
        sendTyping,
        uploadFile,
        editMessage
    };
};
