import { useState, useEffect } from 'react';
import api from '../api/axios';

export type SpaceRole = 'admin' | 'editor' | 'spectator' | null;

export const useSpaceMember = (spaceId?: string) => {
    const [role, setRole] = useState<SpaceRole>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!spaceId) {
            setRole(null);
            setLoading(false);
            return;
        }

        const fetchRole = async () => {
            try {
                // Fetch the current user's profile first
                const userRes = await api.get('/users/me/');
                const userId = userRes.data.id;

                // Check their role in this space
                const memberRes = await api.get(`/crm/space-members/?space=${spaceId}&user=${userId}`);
                if (memberRes.data.results && memberRes.data.results.length > 0) {
                    setRole(memberRes.data.results[0].role);
                } else if (memberRes.data.length > 0) {
                    setRole(memberRes.data[0].role);
                } else {
                    setRole(null);
                }
            } catch (error) {
                console.error("Failed to fetch space role:", error);
                setRole(null);
            } finally {
                setLoading(false);
            }
        };

        fetchRole();
    }, [spaceId]);

    return {
        role,
        loading,
        isAdmin: role === 'admin',
        isEditor: role === 'editor',
        isSpectator: role === 'spectator',
        canEdit: role === 'admin' || role === 'editor',
        canManageMembers: role === 'admin'
    };
};
