import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Tag, ExternalLink, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface GithubReleasesTabProps {
    repoFullName: string;
}

const GithubReleasesTab: React.FC<GithubReleasesTabProps> = ({ repoFullName }) => {
    const [releases, setReleases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReleases = async () => {
            try {
                const response = await api.get(`/integrations/github/data/?action=releases&repo=${repoFullName}`);
                setReleases(response.data);
            } catch (err) {
                console.error("Failed to fetch releases", err);
                setError("Impossible de récupérer les déploiements.");
            } finally {
                setLoading(false);
            }
        };

        if (repoFullName) {
            fetchReleases();
        }
    }, [repoFullName]);

    if (!repoFullName) return null;

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Chargement des déploiements...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (releases.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Tag className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-sm font-medium text-gray-900">Aucune release trouvée</h3>
                <p className="mt-1 text-sm text-gray-500">Ce dépôt ne contient pas encore de version publiée sur GitHub.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {releases.map((release) => (
                <div key={release.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="border-b border-gray-100 bg-gray-50/50 p-4 sm:flex sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 text-green-700 p-2 rounded-lg">
                                <Tag size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    {release.name}
                                </h3>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Tag size={14} /> {release.tag_name}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CalendarDays size={14} /> {format(new Date(release.published_at), 'dd MMM yyyy, HH:mm', { locale: fr })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-0 flex shrink-0">
                            <a
                                href={release.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Voir sur GitHub <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>

                    {release.body && (
                        <div className="p-6">
                            <div className="prose prose-sm prose-indigo max-w-none prose-a:text-indigo-600 hover:prose-a:text-indigo-500">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {release.body}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default GithubReleasesTab;
