import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';

// Types
export interface Company {
    id: string;
    name: string;
    domain?: string;
    status: string;
}

// Keys
export const companyKeys = {
    all: ['companies'] as const,
    lists: () => [...companyKeys.all, 'list'] as const,
    list: (filters: string) => [...companyKeys.lists(), { filters }] as const,
    details: () => [...companyKeys.all, 'detail'] as const,
    detail: (id: string) => [...companyKeys.details(), id] as const,
};

// Hooks
export function useCompanies(filters?: any) {
    return useQuery({
        queryKey: companyKeys.list(JSON.stringify(filters)),
        queryFn: async () => {
            const { data } = await axios.get('/crm/companies/', { params: filters });
            return data;
        },
    });
}

export function useCompany(id: string) {
    return useQuery({
        queryKey: companyKeys.detail(id),
        queryFn: async () => {
            const { data } = await axios.get(`/crm/companies/${id}/`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateCompany() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newCompany: Partial<Company>) => {
            const { data } = await axios.post('/crm/companies/', newCompany);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
        },
    });
}
