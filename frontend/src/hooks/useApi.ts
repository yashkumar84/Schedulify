import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

// Dashboard Hooks
export const useDashboardStats = () => {
    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await api.get('/dashboard/stats');
            return response.data;
        },
    });
};

// Projects Hooks
// Auth
export const useRegister = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/auth/register', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
        },
    });
};

export const useProjects = () => {
    return useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await api.get('/projects');
            return response.data;
        },
    });
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (projectData: any) => {
            const response = await api.post('/projects', projectData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
};

export const useUpdateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ projectId, data }: { projectId: string; data: any }) => {
            const response = await api.put(`/projects/${projectId}`, data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
        },
    });
};

export const useDeleteProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (projectId: string) => {
            const response = await api.delete(`/projects/${projectId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
};

export const useProjectDetail = (projectId: string) => {
    return useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => {
            const response = await api.get(`/projects/${projectId}`);
            return response.data;
        },
        enabled: !!projectId,
    });
};

// Tasks Hooks
export const useTasks = (projectId: string) => {
    return useQuery({
        queryKey: ['tasks', projectId],
        queryFn: async () => {
            const response = await api.get(`/tasks/project/${projectId}`);
            return response.data;
        },
        enabled: !!projectId,
    });
};

export const useProjectTasks = (projectId: string) => {
    return useQuery({
        queryKey: ['tasks', 'project', projectId],
        queryFn: async () => {
            const response = await api.get(`/tasks/project/${projectId}`);
            return response.data;
        },
        enabled: !!projectId,
    });
};

export const useAdminAllTasks = () => {
    return useQuery({
        queryKey: ['tasks', 'all'],
        queryFn: async () => {
            const response = await api.get('/tasks/all');
            return response.data;
        },
    });
};

export const useUpdateTaskStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
            const response = await api.put(`/tasks/${taskId}`, { status });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

export const useCreateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (taskData: any) => {
            const response = await api.post('/tasks', taskData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
};

export const useUpdateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ taskId, data }: { taskId: string; data: any }) => {
            const response = await api.put(`/tasks/${taskId}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task'] });
        },
    });
};

export const useDeleteTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (taskId: string) => {
            const response = await api.delete(`/tasks/${taskId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
};

export const useAddComment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ taskId, text }: { taskId: string; text: string }) => {
            const response = await api.post(`/tasks/${taskId}/comments`, { text });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task'] });
        },
    });
};

// Task Approval Hooks
export const usePendingTasks = () => {
    return useQuery({
        queryKey: ['tasks', 'pending'],
        queryFn: async () => {
            const response = await api.get('/tasks/pending');
            return response.data;
        },
    });
};

export const useApproveTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (taskId: string) => {
            const response = await api.put(`/tasks/${taskId}/approve`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
};

export const useRejectTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ taskId, reason }: { taskId: string; reason: string }) => {
            const response = await api.put(`/tasks/${taskId}/reject`, { reason });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
};

export const useTaskById = (taskId: string) => {
    return useQuery({
        queryKey: ['task', taskId],
        queryFn: async () => {
            const response = await api.get(`/tasks/${taskId}`);
            return response.data;
        },
        enabled: !!taskId,
    });
};

// Expenses Hooks
export const useExpenses = () => {
    return useQuery({
        queryKey: ['expenses'],
        queryFn: async () => {
            const response = await api.get('/finance');
            return response.data;
        },
    });
};

export const useCreateExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (expenseData: any) => {
            const response = await api.post('/finance', expenseData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
};

export const useUpdateExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ expenseId, data }: { expenseId: string; data: any }) => {
            const response = await api.put(`/finance/${expenseId}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
};

export const useDeleteExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (expenseId: string) => {
            const response = await api.delete(`/finance/${expenseId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
};

// Team & Role Management
// User Hooks
export const useProfile = () => {
    return useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const response = await api.get('/users/profile');
            return response.data;
        },
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.put('/users/profile', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.put('/users/change-password', data);
            return response.data;
        },
    });
};

export const useTeam = () => {
    return useQuery({
        queryKey: ['members'],
        queryFn: async () => {
            const response = await api.get('/team');
            return response.data;
        },
    });
};

export const useUpdateUserRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            const response = await api.put(`/team/${userId}/role`, { role });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
        },
    });
};

export const useUpdateMemberPermissions = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, permissions }: { userId: string; permissions: any }) => {
            const response = await api.put(`/team/${userId}/permissions`, { permissions });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
        },
    });
};

export const useDeleteMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await api.delete(`/team/${userId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
};

export const useUpdateMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
            const response = await api.put(`/team/${userId}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
        },
    });
};
// Notification Hooks
export const useNotifications = () => {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await api.get('/notifications');
            return response.data;
        },
    });
};

export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (notificationId: string) => {
            const response = await api.put(`/notifications/${notificationId}/read`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useMarkAllNotificationsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await api.put('/notifications/read-all');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useActivities = (projectId?: string) => {
    return useQuery({
        queryKey: ['activities', projectId],
        queryFn: async () => {
            const response = await api.get('/activities', {
                params: { projectId }
            });
            return response.data;
        },
    });
};
// File Upload Hook
export const useUpload = () => {
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        }
    });
};
