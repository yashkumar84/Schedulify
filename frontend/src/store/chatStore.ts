import { create } from 'zustand';

interface ChatState {
    isOpen: boolean;
    projectId?: string;
    projectName?: string;
    receiverId?: string;
    receiverName?: string;
    openProjectChat: (projectId: string, projectName: string) => void;
    openPersonalChat: (userId: string, userName: string) => void;
    closeChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    isOpen: false,
    projectId: undefined,
    projectName: undefined,
    receiverId: undefined,
    receiverName: undefined,
    openProjectChat: (projectId, projectName) => set({
        isOpen: true,
        projectId,
        projectName,
        receiverId: undefined,
        receiverName: undefined
    }),
    openPersonalChat: (userId, userName) => set({
        isOpen: true,
        receiverId: userId,
        receiverName: userName,
        projectId: undefined,
        projectName: undefined
    }),
    closeChat: () => set({ isOpen: false })
}));
