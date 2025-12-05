import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, DollarSign, Calendar, FileText, Plus } from 'lucide-react';
import TaskBoard from '../tasks/TaskBoard';
import clsx from 'clsx';
import DocumentList from '../../components/documents/DocumentList';


const ContractDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'tasks' | 'meetings' | 'documents'>('tasks');
    const [meetings, setMeetings] = useState<any[]>([]);

    useEffect(() => {
        fetchContract();
        fetchMeetings();
    }, [id]);

    const fetchContract = async () => {
        try {
            const response = await api.get(`/crm/contracts/${id}/`);
            setContract(response.data);
        } catch (error) {
            console.error("Failed to fetch contract", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMeetings = async () => {
        try {
            const response = await api.get(`/crm/meetings/?contract=${id}`);
            if (Array.isArray(response.data)) {
                setMeetings(response.data);
            } else if (response.data.results && Array.isArray(response.data.results)) {
                setMeetings(response.data.results);
            } else {
                setMeetings([]);
            }
        } catch (error) {
            console.error("Failed to fetch meetings", error);
            setMeetings([]);
        }
    };

    if (loading) return <div className="p-8">Chargement...</div>;
    if (!contract) return <div className="p-8">Contrat introuvable</div>;

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
                <div className="flex items-start gap-4 w-full md:w-auto">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 mt-1 md:mt-0 flex-shrink-0">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-gray-900 break-words">{contract.title}</h1>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1 whitespace-nowrap">
                                <DollarSign size={14} />
                                {contract.amount ? `${contract.amount} €` : 'Aucun montant'}
                            </span>
                            <span className="flex items-center gap-1 whitespace-nowrap">
                                <Calendar size={14} />
                                {contract.start_date} - {contract.end_date || 'En cours'}
                            </span>
                            <span className={clsx(
                                "px-2 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap",
                                contract.status === 'active' ? "bg-green-100 text-green-800" :
                                    contract.status === 'draft' ? "bg-gray-100 text-gray-800" :
                                        contract.status === 'signed' ? "bg-blue-100 text-blue-800" :
                                            "bg-purple-100 text-purple-800"
                            )}>
                                {contract.status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {contract.file && (
                        <a
                            href={contract.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                        >
                            <FileText size={16} />
                            <span className="hidden sm:inline">Voir le PDF</span>
                            <span className="sm:hidden">PDF</span>
                        </a>
                    )}
                    <button
                        onClick={() => navigate(`/crm/contracts/${id}/edit`)}
                        className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Modifier
                    </button>
                    <button
                        onClick={async () => {
                            if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
                                try {
                                    await api.delete(`/crm/contracts/${id}/`);
                                    navigate(-1);
                                } catch (error) {
                                    console.error("Failed to delete contract", error);
                                    alert("Échec de la suppression du contrat");
                                }
                            }
                        }}
                        className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100"
                    >
                        Supprimer
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-6">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={clsx(
                            "py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'tasks' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Tâches
                    </button>
                    <button
                        onClick={() => setActiveTab('meetings')}
                        className={clsx(
                            "py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'meetings' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Réunions
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={clsx(
                            "py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'documents' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Documents
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'tasks' && (
                    <TaskBoard filter={{ contract: id }} />
                )}

                {activeTab === 'meetings' && (
                    <div className="p-6 overflow-y-auto h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium text-gray-900">Réunions</h2>
                            <button
                                onClick={() => navigate(`/crm/meetings/new?contract=${id}&company=${contract.company}`)}
                                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                            >
                                <Plus size={16} />
                                Nouvelle Réunion
                            </button>
                        </div>
                        <div className="grid gap-4">
                            {meetings.map(meeting => (
                                <div key={meeting.id} onClick={() => navigate(`/crm/meetings/${meeting.id}`)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-indigo-500 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                <Calendar size={14} />
                                                {new Date(meeting.date).toLocaleString('fr-FR')}
                                                <span className="capitalize px-2 py-0.5 bg-gray-100 rounded text-xs">
                                                    {meeting.type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {meeting.notes && (
                                        <div className="mt-4 border-t border-gray-100 pt-4">
                                            <div className="prose prose-sm max-w-none">
                                                <p className="text-gray-500 italic">Cliquez pour voir les notes...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {meetings.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    Aucune réunion enregistrée pour ce contrat.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="p-6 overflow-y-auto h-full">
                        <DocumentList contractId={id} companyId={contract.company} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContractDetail;
