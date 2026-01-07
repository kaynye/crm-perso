import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';

export const dashboardKeys = {
    all: ['dashboard'] as const,
};

export function useDashboard() {
    return useQuery({
        queryKey: dashboardKeys.all,
        queryFn: async () => {
            const { data } = await axios.get('/dashboard/');
            return data;
        },
    });
}
