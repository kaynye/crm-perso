import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Star, GitFork, AlertCircle, Code2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GithubStatsWidgetProps {
    repoFullName: string;
}

const GithubStatsWidget: React.FC<GithubStatsWidgetProps> = ({ repoFullName }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get(`/integrations/github/data/?action=stats&repo=${repoFullName}`);
                setStats(response.data);
            } catch (err) {
                console.error("Failed to fetch Github stats", err);
            } finally {
                setLoading(false);
            }
        };

        if (repoFullName) {
            fetchStats();
        }
    }, [repoFullName]);

    if (!repoFullName || loading || !stats) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-700 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path>
                </svg>
                Statistiques du Dépôt GitHub
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1">
                        <Star size={14} /> Stars
                    </span>
                    <span className="text-lg font-semibold text-gray-900">{stats.stars}</span>
                </div>
                <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1">
                        <GitFork size={14} /> Forks
                    </span>
                    <span className="text-lg font-semibold text-gray-900">{stats.forks}</span>
                </div>
                <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1">
                        <AlertCircle size={14} /> Issues
                    </span>
                    <span className="text-lg font-semibold text-gray-900">{stats.open_issues}</span>
                </div>
                <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1">
                        <Code2 size={14} /> Language
                    </span>
                    <span className="text-lg font-semibold text-gray-900">{stats.language || 'N/A'}</span>
                </div>
            </div>

            {stats.updated_at && (
                <div className="mt-4 text-xs flex items-center gap-1.5 text-gray-500 justify-end">
                    <Clock size={12} /> Dernière mise à jour il y a {formatDistanceToNow(new Date(stats.updated_at), { locale: fr })}
                </div>
            )}
        </div>
    );
};

export default GithubStatsWidget;
