import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Calendar, Building } from 'lucide-react';
import Editor from '../../components/Editor';
import type { OutputData } from '@editorjs/editorjs';

const MeetingDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [meeting, setMeeting] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editorData, setEditorData] = useState<OutputData>({ blocks: [] });
    const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);

    useEffect(() => {
        fetchMeeting();
    }, [id]);

    const fetchMeeting = async () => {
        try {
            const response = await api.get(`/crm/meetings/${id}/`);
            setMeeting(response.data);
            if (response.data.notes) {
                try {
                    setEditorData(JSON.parse(response.data.notes));
                } catch (e) {
                    console.error("Failed to parse notes", e);
                }
            }
        } catch (error) {
            console.error("Failed to fetch meeting", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotesSave = async (data: OutputData) => {
        try {
            await api.patch(`/crm/meetings/${id}/`, { notes: JSON.stringify(data) });
        } catch (error) {
            console.error("Failed to save notes", error);
        }
    };

    if (loading) return <div className="p-8">Chargement...</div>;
    if (!meeting) return <div className="p-8">Réunion introuvable</div>;

    const templates = {
        discovery: {
            blocks: [
                { type: "header", data: { text: "Appel de Découverte", level: 2 } },
                { type: "header", data: { text: "Participants", level: 3 } },
                { type: "list", data: { style: "unordered", items: ["Client : ", "Interne : "] } },
                { type: "header", data: { text: "Ordre du jour", level: 3 } },
                { type: "list", data: { style: "unordered", items: ["Introduction et présentation", "Analyse des besoins", "Démonstration (si applicable)", "Prochaines étapes"] } },
                { type: "header", data: { text: "Notes de discussion", level: 3 } },
                { type: "paragraph", data: { text: "Points clés abordés..." } },
                { type: "header", data: { text: "Points de douleur (Pain Points)", level: 3 } },
                { type: "list", data: { style: "unordered", items: [""] } },
                { type: "header", data: { text: "Budget et Délais", level: 3 } },
                { type: "paragraph", data: { text: "Budget estimé : \nDate de lancement souhaitée : " } }
            ]
        },
        update: {
            blocks: [
                { type: "header", data: { text: "Point d'Avancement Projet", level: 2 } },
                { type: "header", data: { text: "État d'avancement", level: 3 } },
                { type: "list", data: { style: "unordered", items: ["✅ Terminé : ", "🚧 En cours : ", "📅 À venir : "] } },
                { type: "header", data: { text: "Points bloquants / Risques", level: 3 } },
                { type: "paragraph", data: { text: "Aucun pour le moment." } },
                { type: "header", data: { text: "Décisions prises", level: 3 } },
                { type: "list", data: { style: "unordered", items: [""] } },
                { type: "header", data: { text: "Prochaines étapes (Action Items)", level: 3 } },
                { type: "list", data: { style: "unordered", items: ["Qui : Quoi (Date)"] } }
            ]
        },
        closing: {
            blocks: [
                { type: "header", data: { text: "Réunion de Clôture", level: 2 } },
                { type: "header", data: { text: "Bilan du projet", level: 3 } },
                { type: "paragraph", data: { text: "Résumé des réalisations..." } },
                { type: "header", data: { text: "Livrables validés", level: 3 } },
                { type: "list", data: { style: "unordered", items: [""] } },
                { type: "header", data: { text: "Feedback Client", level: 3 } },
                { type: "paragraph", data: { text: "Points positifs : \nPoints à améliorer : " } }
            ]
        }
    };

    const applyTemplate = (templateKey: keyof typeof templates) => {
        if (window.confirm('Ceci écrasera les notes actuelles. Continuer ?')) {
            const newData = templates[templateKey];
            setEditorData(newData);
            handleNotesSave(newData);
            setIsTemplateMenuOpen(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{meeting.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {meeting.date ? new Date(meeting.date).toLocaleString('fr-FR') : 'Aucune date'}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium capitalize">
                                {meeting.type}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(`/crm/meetings/${id}/edit`)}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Modifier
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Info */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 grid grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Entreprise</h3>
                            <div className="flex items-center gap-2 text-gray-900">
                                <Building size={16} className="text-gray-400" />
                                {meeting.company_name || 'Chargement...'}
                                {meeting.company && (
                                    <button onClick={() => navigate(`/crm/companies/${meeting.company}`)} className="text-indigo-600 hover:underline text-sm">
                                        Voir l'entreprise
                                    </button>
                                )}
                            </div>
                        </div>
                        {meeting.contract && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Contrat</h3>
                                <div className="flex items-center gap-2 text-gray-900">
                                    <FileText size={16} className="text-gray-400" />
                                    <button onClick={() => navigate(`/crm/contracts/${meeting.contract}`)} className="text-indigo-600 hover:underline text-sm">
                                        Voir le contrat
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes Editor */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[500px] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg flex justify-between items-center">
                            <h3 className="font-medium text-gray-900">Notes de réunion</h3>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <button
                                        onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                                        className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Modèles
                                    </button>
                                    {isTemplateMenuOpen && (
                                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                            <button onClick={() => applyTemplate('discovery')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                Appel de Découverte
                                            </button>
                                            <button onClick={() => applyTemplate('update')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                Point d'Avancement
                                            </button>
                                            <button onClick={() => applyTemplate('closing')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                Clôture de Projet
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 flex-1 prose max-w-none">
                            <Editor
                                data={editorData}
                                onChange={handleNotesSave}
                                readOnly={false} // Always editable
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper icon
const FileText = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

export default MeetingDetail;
