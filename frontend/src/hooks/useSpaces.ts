import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';

// Types
export interface Space {
    id: string;
    name: string;
    domain?: string;
    status: string;
}

// Keys
export const spaceKeys = {
    all: ['spaces'] as const,
    lists: () => [...spaceKeys.all, 'list'] as const,
    list: (filters: string) => [...spaceKeys.lists(), { filters }] as const,
    details: () => [...spaceKeys.all, 'detail'] as const,
    detail: (id: string) => [...spaceKeys.details(), id] as const,
};

// Hooks
export function useSpaces(filters?: any) {
    return useQuery({
        queryKey: spaceKeys.list(JSON.stringify(filters)),
        queryFn: async () => {
            const { data } = await axios.get('/crm/spaces/', { params: filters });
            return data;
        },
    });
}

export function useSpace(id: string) {
    return useQuery({
        queryKey: spaceKeys.detail(id),
        queryFn: async () => {
            const { data } = await axios.get(`/crm/spaces/${id}/`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateSpace() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newSpace: Partial<Space>) => {
            const { data } = await axios.post('/crm/spaces/', newSpace);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: spaceKeys.lists() });
        },
    });
}
