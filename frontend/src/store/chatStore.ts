import { create } from 'zustand';

interface ChatState {
    isOpen: boolean;
    projectId?: string;
    projectName?: string;
    receiverId?: string;
    receiverName?: string;
    hasUnreadMessages: boolean;
    openProjectChat: (projectId: string, projectName: string) => void;
    openPersonalChat: (userId: string, userName: string) => void;
    openGlobalChat: () => void;
    setHasUnreadMessages: (hasUnread: boolean) => void;
    closeChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    isOpen: false,
    projectId: undefined,
    projectName: undefined,
    receiverId: undefined,
    receiverName: undefined,
    hasUnreadMessages: false,
    openProjectChat: (projectId, projectName) => set({
        isOpen: true,
        projectId,
        projectName,
        receiverId: undefined,
        receiverName: undefined,
        hasUnreadMessages: false
    }),
    openPersonalChat: (userId, userName) => set({
        isOpen: true,
        receiverId: userId,
        receiverName: userName,
        projectId: undefined,
        projectName: undefined,
        hasUnreadMessages: false
    }),
    openGlobalChat: () => set({
        isOpen: true,
        projectId: undefined,
        projectName: undefined,
        receiverId: undefined,
        receiverName: undefined,
        hasUnreadMessages: false
    }),
    setHasUnreadMessages: (hasUnread) => set({ hasUnreadMessages: hasUnread }),
    closeChat: () => set({ isOpen: false })
}));
