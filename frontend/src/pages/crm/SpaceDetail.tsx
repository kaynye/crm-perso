import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { MapPin, Plus, Building, Share2 } from 'lucide-react';
import clsx from 'clsx';
import DocumentList from '../../components/documents/DocumentList';
import ShareModal from '../../components/crm/ShareModal';
import TaskBoard from '../tasks/TaskBoard';
import SpaceMembersTab from '../../components/crm/SpaceMembersTab';
import ActivityLogTab from '../../components/crm/ActivityLogTab';
import GithubCommitsTab from '../../components/crm/GithubCommitsTab';
import GithubStatsWidget from '../../components/crm/GithubStatsWidget';
import GithubReleasesTab from '../../components/crm/GithubReleasesTab';
import { useSpaceVocabulary } from '../../hooks/useSpaceVocabulary';
import { useSpaceMember } from '../../hooks/useSpaceMember';

const SpaceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [space, setSpace] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'meetings' | 'documents' | 'tasks' | 'members' | 'activities' | 'commits' | 'releases'>('overview');
    const [contracts, setContracts] = useState<any[]>([]);
    const [meetings, setMeetings] = useState<any[]>([]);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const vocab = useSpaceVocabulary(space);
    const { canEdit, canManageMembers } = useSpaceMember(id);

    useEffect(() => {
        fetchSpace();
    }, [id]);

    useEffect(() => {
        if (space?.type_details) {
            if (space.type_details.has_contracts) fetchContracts();
            if (space.type_details.has_meetings) fetchMeetings();
        }
    }, [space]);

    const fetchSpace = async () => {
        try {
            const response = await api.get(`/crm/spaces/${id}/`);
            setSpace(response.data);
        } catch (error) {
            console.error("Failed to fetch space", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchContracts = async () => {
        try {
            const response = await api.get(`/crm/contracts/?space=${id}`);
            if (response.data.results) {
                setContracts(response.data.results);
            } else {
                setContracts(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch contracts", error);
        }
    };

    const fetchMeetings = async () => {
        try {
            const response = await api.get(`/crm/meetings/?space=${id}`);
            if (response.data.results) {
                setMeetings(response.data.results);
            } else {
                setMeetings(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch meetings", error);
        }
    };



    if (loading) return <div className="p-8 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>;
    if (!space) return <div className="p-8 text-center text-gray-500">Espace introuvable</div>;

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
                            <Building size={24} className="md:w-8 md:h-8" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{space.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-500 mt-1">
                                {space.industry && <span>{space.industry}</span>}
                                {space.website && (
                                    <a href={space.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate max-w-[200px]">
                                        {space.website}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="w-full md:w-auto px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <Share2 size={16} />
                        Partager
                    </button>
                    {canEdit && (
                        <button
                            onClick={() => navigate(`/crm/spaces/${id}/edit`)}
                            className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Modifier l'espace
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-6 mt-8 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={clsx(
                            "pb-3 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap",
                            activeTab === 'overview' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Aperçu
                    </button>
                    {space.type_details?.has_contracts && (
                        <button
                            onClick={() => setActiveTab('contracts')}
                            className={clsx(
                                "pb-3 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap",
                                activeTab === 'contracts' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {vocab.contract_plural}
                            <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                                {contracts.length}
                            </span>
                        </button>
                    )}
                    {space.type_details?.has_meetings && (
                        <button
                            onClick={() => setActiveTab('meetings')}
                            className={clsx(
                                "pb-3 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap",
                                activeTab === 'meetings' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {vocab.meeting_plural}
                            <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                                {meetings.length}
                            </span>
                        </button>
                    )}
                    {space.type_details?.has_tasks && (
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={clsx(
                                "pb-3 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap",
                                activeTab === 'tasks' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {vocab.task_plural}
                        </button>
                    )}
                    {space.type_details?.has_documents && (
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={clsx(
                                "pb-3 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap",
                                activeTab === 'documents' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {vocab.document_plural}
                        </button>
                    )}
                    {canManageMembers && (
                        <button
                            onClick={() => setActiveTab('members')}
                            className={clsx(
                                "pb-3 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap",
                                activeTab === 'members' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {vocab.member_plural}
                        </button>
                    )}
                    {canManageMembers && (
                        <button
                            onClick={() => setActiveTab('activities')}
                            className={clsx(
                                "pb-3 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap",
                                activeTab === 'activities' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Activités
                        </button>
                    )}
                    {space.github_repo && (
                        <button
                            onClick={() => setActiveTab('commits')}
                            className={clsx(
                                "pb-3 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap flex items-center gap-2",
                                activeTab === 'commits' ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path>
                            </svg>
                            Commits
                        </button>
                    )}
                    {space.github_repo && (
                        <button
                            onClick={() => setActiveTab('releases')}
                            className={clsx(
                                "pb-3 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap flex items-center gap-2",
                                activeTab === 'releases' ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Déploiements
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">À propos</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-gray-500">Taille</label>
                                            <p className="text-gray-900 mt-1">{space.size || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-500">Secteur</label>
                                            <p className="text-gray-900 mt-1">{space.industry || '-'}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-sm text-gray-500">Adresse</label>
                                            <p className="text-gray-900 flex items-center gap-2 mt-1">
                                                <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                                                {space.address || '-'}
                                            </p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-sm text-gray-500">Tags</label>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {space.tags ? space.tags.split(',').map((tag: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                                        {tag.trim()}
                                                    </span>
                                                )) : <span className="text-gray-400 text-sm">Aucun tag</span>}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-sm text-gray-500">Notes</label>
                                            <p className="text-gray-900 mt-1 whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-md border border-gray-100">
                                                {space.notes || 'Aucune note'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {space.github_repo && (
                                <GithubStatsWidget repoFullName={space.github_repo} />
                            )}
                            {/* Stats or other info could go here */}
                        </div>
                    </div>
                )}

                {activeTab === 'contracts' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900 capitalize">{vocab.contract_plural}</h3>
                            {canEdit && (
                                <button
                                    onClick={() => navigate(`/crm/contracts/new?space=${id}`)}
                                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                                >
                                    <Plus size={16} />
                                    <span className="hidden md:inline">Nouveau {vocab.contract}</span>
                                    <span className="md:hidden">Nouveau</span>
                                </button>
                            )}
                        </div>
                        <div className="grid gap-4">
                            {contracts.map(contract => (
                                <div
                                    key={contract.id}
                                    onClick={() => navigate(`/crm/contracts/${contract.id}`)}
                                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-indigo-500 transition-colors"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{contract.title}</h4>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {contract.start_date} - {contract.end_date || 'En cours'}
                                            </p>
                                        </div>
                                        <span className={clsx(
                                            "px-2 py-1 rounded-full text-xs font-medium capitalize",
                                            contract.status === 'active' ? "bg-green-100 text-green-800" :
                                                contract.status === 'draft' ? "bg-gray-100 text-gray-800" :
                                                    contract.status === 'signed' ? "bg-blue-100 text-blue-800" :
                                                        "bg-purple-100 text-purple-800"
                                        )}>
                                            {contract.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {contracts.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                                    <p className="text-gray-500">Aucun contrat trouvé</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'meetings' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900 capitalize">{vocab.meeting_plural}</h3>
                            {canEdit && (
                                <button
                                    onClick={() => navigate(`/crm/meetings/new?space=${id}`)}
                                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                                >
                                    <Plus size={16} />
                                    <span className="hidden md:inline">Nouveau/Nouvelle {vocab.meeting}</span>
                                    <span className="md:hidden">Nouveau</span>
                                </button>
                            )}
                        </div>
                        <div className="grid gap-4">
                            {meetings.map(meeting => (
                                <div
                                    key={meeting.id}
                                    onClick={() => navigate(`/crm/meetings/${meeting.id}`)}
                                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-indigo-500 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {new Date(meeting.date).toLocaleString('fr-FR')}
                                            </p>
                                        </div>
                                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium capitalize">
                                            {meeting.type}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {meetings.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                                    <p className="text-gray-500">Aucune réunion trouvée</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="h-[calc(100vh-200px)]">
                        <TaskBoard filter={{ space: id }} />
                    </div>
                )}

                {activeTab === 'documents' && (
                    <DocumentList spaceId={id!} canEdit={canEdit} />
                )}

                {activeTab === 'members' && canManageMembers && (
                    <SpaceMembersTab spaceId={id!} />
                )}

                {activeTab === 'activities' && canManageMembers && (
                    <ActivityLogTab spaceId={id!} />
                )}

                {activeTab === 'commits' && space.github_repo && (
                    <GithubCommitsTab repoFullName={space.github_repo} />
                )}

                {activeTab === 'releases' && space.github_repo && (
                    <GithubReleasesTab repoFullName={space.github_repo} />
                )}
            </div>
            {/* Share Modal */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                spaceId={id!}
            />
        </div>
    );
};

export default SpaceDetail;
