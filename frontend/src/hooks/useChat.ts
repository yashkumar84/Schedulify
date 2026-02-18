import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../utils/socket';
import api from '../utils/api';

interface Message {
    _id: string;
    project: string;
    sender: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    content: string;
    type: 'text' | 'system' | 'file';
    createdAt: string;
    updatedAt: string;
}

interface OnlineUser {
    userId: string;
    userName: string;
    userRole: string;
}

export const useChat = (projectId: string) => {
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
            const response = await api.get(`/chat/${projectId}/messages?limit=50`);
            setMessages(response.data.messages);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    // Send message
    const sendMessage = useCallback((content: string) => {
        const socket = socketRef.current;
        if (socket && content.trim()) {
            socket.emit('send-message', { projectId, content: content.trim() });
        }
    }, [projectId]);

    // Send typing indicator
    const sendTyping = useCallback(() => {
        const socket = socketRef.current;
        if (socket) {
            socket.emit('typing', { projectId });

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = window.setTimeout(() => {
                socket.emit('stop-typing', { projectId });
            }, 2000);
        }
    }, [projectId]);

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        // Join project room
        socket.emit('join-project', projectId);
        setIsConnected(true);

        // Load initial messages
        loadMessages();

        // Socket event listeners
        const handleNewMessage = (message: Message) => {
            setMessages(prev => [...prev, message]);
        };

        const handleOnlineUsers = (users: OnlineUser[]) => {
            setOnlineUsers(users);
        };

        const handleUserJoined = (user: OnlineUser) => {
            setOnlineUsers(prev => {
                const exists = prev.some(u => u.userId === user.userId);
                if (exists) return prev;
                return [...prev, user];
            });
        };

        const handleUserLeft = (data: { userId: string }) => {
            setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
        };

        const handleUserTyping = (data: { userId: string; userName: string }) => {
            setTypingUsers(prev => new Set(prev).add(data.userName));
        };

        const handleUserStopTyping = (data: { userId: string }) => {
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                // Use ref to avoid dependency on onlineUsers in useEffect
                const user = onlineUsersRef.current.find(u => u.userId === data.userId);
                if (user) {
                    newSet.delete(user.userName);
                }
                return newSet;
            });
        };

        socket.on('new-message', handleNewMessage);
        socket.on('online-users', handleOnlineUsers);
        socket.on('user-joined', handleUserJoined);
        socket.on('user-left', handleUserLeft);
        socket.on('user-typing', handleUserTyping);
        socket.on('user-stop-typing', handleUserStopTyping);

        // Cleanup
        return () => {
            socket.emit('leave-project', projectId);
            socket.off('new-message', handleNewMessage);
            socket.off('online-users', handleOnlineUsers);
            socket.off('user-joined', handleUserJoined);
            socket.off('user-left', handleUserLeft);
            socket.off('user-typing', handleUserTyping);
            socket.off('user-stop-typing', handleUserStopTyping);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [projectId, loadMessages]);

    return {
        messages,
        onlineUsers,
        typingUsers: Array.from(typingUsers),
        isConnected,
        isLoading,
        sendMessage,
        sendTyping
    };
};
