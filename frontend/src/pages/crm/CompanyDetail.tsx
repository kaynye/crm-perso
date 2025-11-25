import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { MapPin, Plus, Building } from 'lucide-react';
import clsx from 'clsx';

const CompanyDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'meetings'>('overview');
    const [contracts, setContracts] = useState<any[]>([]);
    const [meetings, setMeetings] = useState<any[]>([]);

    useEffect(() => {
        fetchCompany();
        fetchContracts();
        fetchMeetings();
    }, [id]);

    const fetchCompany = async () => {
        try {
            const response = await api.get(`/crm/companies/${id}/`);
            setCompany(response.data);
        } catch (error) {
            console.error("Failed to fetch company", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchContracts = async () => {
        try {
            const response = await api.get(`/crm/contracts/?company=${id}`);
            setContracts(response.data);
        } catch (error) {
            console.error("Failed to fetch contracts", error);
        }
    };

    const fetchMeetings = async () => {
        try {
            const response = await api.get(`/crm/meetings/?company=${id}`);
            setMeetings(response.data);
        } catch (error) {
            console.error("Failed to fetch meetings", error);
        }
    };

    if (loading) return <div className="p-8">Chargement...</div>;
    if (!company) return <div className="p-8">Entreprise introuvable</div>;

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                            <Building size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                {company.industry && <span>{company.industry}</span>}
                                {company.website && (
                                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                        {company.website}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(`/crm/companies/${id}/edit`)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                    >
                        Modifier l'entreprise
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 mt-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={clsx(
                            "pb-3 text-sm font-medium border-b-2 transition-colors capitalize",
                            activeTab === 'overview' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Aperçu
                    </button>
                    <button
                        onClick={() => setActiveTab('contracts')}
                        className={clsx(
                            "pb-3 text-sm font-medium border-b-2 transition-colors capitalize",
                            activeTab === 'contracts' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Contrats
                        <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                            {contracts.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('meetings')}
                        className={clsx(
                            "pb-3 text-sm font-medium border-b-2 transition-colors capitalize",
                            activeTab === 'meetings' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Réunions
                        <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                            {meetings.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">À propos</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-gray-500">Taille</label>
                                            <p className="text-gray-900 mt-1">{company.size || ''}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-500">Secteur</label>
                                            <p className="text-gray-900 mt-1">{company.industry || ''}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-sm text-gray-500">Adresse</label>
                                            <p className="text-gray-900 flex items-center gap-2 mt-1">
                                                <MapPin size={16} className="text-gray-400" />
                                                {company.address || ''}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-sm text-gray-500">Tags</label>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {company.tags ? company.tags.split(',').map((tag: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                                        {tag.trim()}
                                                    </span>
                                                )) : 'Aucun tag'}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-sm text-gray-500">Notes</label>
                                            <p className="text-gray-900 mt-1 whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-md border border-gray-100">
                                                {company.notes || 'Aucune note'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {/* Stats or other info could go here */}
                        </div>
                    </div>
                )}

                {activeTab === 'contracts' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">Contrats</h3>
                            <button
                                onClick={() => navigate(`/crm/contracts/new?company=${id}`)}
                                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                            >
                                <Plus size={16} />
                                Nouveau Contrat
                            </button>
                        </div>
                        <div className="grid gap-4">
                            {contracts.map(contract => (
                                <div
                                    key={contract.id}
                                    onClick={() => navigate(`/crm/contracts/${contract.id}`)}
                                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-indigo-500 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
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
                            <h3 className="text-lg font-medium text-gray-900">Réunions</h3>
                            <button
                                onClick={() => navigate(`/crm/meetings/new?company=${id}`)}
                                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                            >
                                <Plus size={16} />
                                Nouvelle Réunion
                            </button>
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
            </div>
        </div>
    );
};

export default CompanyDetail;
