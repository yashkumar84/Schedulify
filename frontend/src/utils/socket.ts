import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket: Socket | null = null;

export const initializeSocket = () => {
    const token = useAuthStore.getState().token;

    if (!token) {
        console.error('No authentication token found');
        return null;
    }

    if (socket?.connected) {
        return socket;
    }

    const VITE_API_URL = import.meta.env.VITE_API_URL;
    const SOCKET_URL = VITE_API_URL
        ? (VITE_API_URL.startsWith('http') ? VITE_API_URL.replace('/api', '') : window.location.origin)
        : 'https://schedulifynow.com';

    socket = io(SOCKET_URL, {
        auth: {
            token
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
    });

    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
    });

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        return initializeSocket();
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
