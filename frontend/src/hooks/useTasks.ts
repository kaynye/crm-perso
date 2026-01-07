import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios'; // Assuming configured axios instance

// Types
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
}

// Keys
export const taskKeys = {
    all: ['tasks'] as const,
    lists: () => [...taskKeys.all, 'list'] as const,
    list: (filters: string) => [...taskKeys.lists(), { filters }] as const,
    details: () => [...taskKeys.all, 'detail'] as const,
    detail: (id: string) => [...taskKeys.details(), id] as const,
};

// Hooks
export function useTasks(filters?: any) {
    return useQuery({
        queryKey: taskKeys.list(JSON.stringify(filters)),
        queryFn: async () => {
            const params = new URLSearchParams(filters);
            const { data } = await axios.get('/tasks/kanban/', { params });
            return data;
        },
    });
}

export function useTask(id: string) {
    return useQuery({
        queryKey: taskKeys.detail(id),
        queryFn: async () => {
            const { data } = await axios.get(`/tasks/${id}/`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newTask: Partial<Task>) => {
            const { data } = await axios.post('/tasks/', newTask);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
        },
    });
}

// ... existing code ...
export function useUpdateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string } & Partial<Task>) => {
            const { data } = await axios.patch(`/tasks/${id}/`, updates);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.id) });
        },
    });
}

export function useDeleteTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/tasks/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
        },
    });
}
