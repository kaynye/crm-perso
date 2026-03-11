import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { GitBranch, GitCommit, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GithubCommitsTabProps {
    repoFullName: string;
}

const GithubCommitsTab: React.FC<GithubCommitsTabProps> = ({ repoFullName }) => {
    const [branches, setBranches] = useState<any[]>([]);
    const [commits, setCommits] = useState<any[]>([]);
    const [selectedBranch, setSelectedBranch] = useState('main');
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [loadingCommits, setLoadingCommits] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await api.get(`/integrations/github/data/?action=branches&repo=${repoFullName}`);
                setBranches(response.data);
                if (response.data.length > 0) {
                    // Try to find 'main' or 'master', otherwise select the first one
                    const defaultBranch = response.data.find((b: any) => b.name === 'main' || b.name === 'master');
                    setSelectedBranch(defaultBranch ? defaultBranch.name : response.data[0].name);
                }
            } catch (err) {
                console.error("Failed to fetch branches", err);
                setError("Impossible de récupérer les branches. Vérifiez que votre compte GitHub est connecté et a accès à ce dépôt.");
            } finally {
                setLoadingBranches(false);
            }
        };

        if (repoFullName) {
            fetchBranches();
        }
    }, [repoFullName]);

    useEffect(() => {
        const fetchCommits = async () => {
            if (!selectedBranch) return;
            try {
                setLoadingCommits(true);
                const response = await api.get(`/integrations/github/data/?action=commits&repo=${repoFullName}&branch=${selectedBranch}`);
                setCommits(response.data);
            } catch (err) {
                console.error("Failed to fetch commits", err);
                setError("Impossible de récupérer les commits pour cette branche.");
            } finally {
                setLoadingCommits(false);
            }
        };

        if (selectedBranch && repoFullName) {
            fetchCommits();
        }
    }, [selectedBranch, repoFullName]);

    if (!repoFullName) {
        return <div className="p-8 text-center text-gray-500">Aucun dépôt GitHub lié à cet espace.</div>;
    }

    if (loadingBranches) {
        return <div className="p-8 text-center text-gray-500">Chargement de l'historique GitHub...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                        <svg className="w-5 h-5 text-gray-700 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">{repoFullName}</h3>
                        <a href={`https://github.com/${repoFullName}`} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                            Ouvrir sur GitHub <ExternalLink size={12} />
                        </a>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <GitBranch size={16} className="text-gray-500" />
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                    >
                        {branches.map(b => (
                            <option key={b.name} value={b.name}>{b.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loadingCommits ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : commits.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">Aucun commit trouvé sur cette branche.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {commits.map((commit) => (
                            <li key={commit.sha} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 pt-1">
                                        {commit.avatar_url ? (
                                            <img src={commit.avatar_url} alt={commit.author} className="w-8 h-8 rounded-full border border-gray-200" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                {commit.author.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate" title={commit.message}>
                                            {commit.message.split('\n')[0]}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                            <span className="font-medium text-gray-700">{commit.author}</span>
                                            <span>a commité il y a {formatDistanceToNow(new Date(commit.date), { locale: fr })}</span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        <GitCommit size={14} className="mr-1" />
                                        <a href={commit.url} target="_blank" rel="noreferrer" className="hover:text-indigo-600">
                                            {commit.sha.substring(0, 7)}
                                        </a>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default GithubCommitsTab;
