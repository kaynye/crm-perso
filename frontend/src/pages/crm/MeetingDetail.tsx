import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Calendar, Building } from 'lucide-react';
import Editor from '../../components/Editor';
import type { OutputData } from '@editorjs/editorjs';
import AISummary from '../../components/common/AISummary';
import { parseEditorJsData } from '../../utils/editorjs-html';
import { generatePDF } from '../../utils/pdf-generator';

const MeetingDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [meeting, setMeeting] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editorData, setEditorData] = useState<OutputData>({ blocks: [] });
    const [initialEditorData, setInitialEditorData] = useState<OutputData | undefined>(undefined);
    const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);

    useEffect(() => {
        fetchMeeting();
        fetchTemplates();
    }, [id]);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/crm/meeting-templates/');
            if (Array.isArray(response.data)) {
                setTemplates(response.data);
            } else if (response.data.results && Array.isArray(response.data.results)) {
                setTemplates(response.data.results);
            } else {
                setTemplates([]);
            }
        } catch (error) {
            console.error("Failed to fetch templates", error);
            setTemplates([]);
        }
    };

    const fetchMeeting = async () => {
        try {
            const response = await api.get(`/crm/meetings/${id}/`);
            setMeeting(response.data);
            if (response.data.notes) {
                try {
                    const parsed = JSON.parse(response.data.notes);
                    setEditorData(parsed);
                    setInitialEditorData(parsed);
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
        setEditorData(data); // Update local state for PDF generation only, do not update initialEditorData to avoid re-render
        try {
            await api.patch(`/crm/meetings/${id}/`, { notes: JSON.stringify(data) });
        } catch (error) {
            console.error("Failed to save notes", error);
        }
    };

    if (loading) return <div className="p-8">Chargement...</div>;
    if (!meeting) return <div className="p-8">Réunion introuvable</div>;

    const applyTemplate = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        if (window.confirm('Ceci écrasera les notes actuelles. Continuer ?')) {
            try {
                const newData = JSON.parse(template.content);
                setEditorData(newData);
                setInitialEditorData(newData); // Force editor update
                handleNotesSave(newData);
            } catch (e) {
                console.error("Failed to parse template content", e);
            }
            setIsTemplateMenuOpen(false);
        }
    };

    const extractTextFromBlocks = (blocks: any[]) => {
        if (!blocks || !Array.isArray(blocks)) return '';
        return blocks.map(block => {
            if (block.type === 'header' || block.type === 'paragraph') {
                return block.data.text;
            } else if (block.type === 'list') {
                return block.data.items.join('\n');
            }
            return '';
        }).join('\n');
    };

    const getMeetingTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            'in_person': 'En présentiel',
            'video': 'Visioconférence',
            'phone': 'Téléphone'
        };
        return types[type] || type;
    };

    const handleDownloadPDF = () => {
        console.log('Generating PDF with data:', editorData);
        const content = parseEditorJsData(editorData);
        console.log('Generated content HTML:', content);
        generatePDF({
            title: meeting.title,
            contentHTML: content,
            metadata: `
                <p>Date: ${new Date(meeting.date).toLocaleString('fr-FR')}</p>
                <p>Type: ${getMeetingTypeLabel(meeting.type)}</p>
            `,
            filename: `${meeting.title.replace(/\s+/g, '_')}_notes.pdf`
        });
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4 w-full md:w-auto">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 mt-1 md:mt-0 flex-shrink-0">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-bold text-gray-900 break-words leading-tight">{meeting.title}</h1>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-2">
                            <span className="flex items-center gap-1 whitespace-nowrap">
                                <Calendar size={14} />
                                {meeting.date ? new Date(meeting.date).toLocaleString('fr-FR') : 'Aucune date'}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium capitalize whitespace-nowrap">
                                {getMeetingTypeLabel(meeting.type)}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto pl-9 md:pl-0">
                    <button
                        onClick={() => navigate(`/crm/meetings/${id}/edit`)}
                        className="w-full md:w-auto flex justify-center items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Modifier
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="w-full md:w-auto flex justify-center items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <FileText size={16} />
                        PDF
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Info */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
                                            {templates.map(template => (
                                                <button
                                                    key={template.id}
                                                    onClick={() => applyTemplate(template.id)}
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    {template.name}
                                                </button>
                                            ))}
                                            {templates.length === 0 && (
                                                <div className="px-4 py-2 text-sm text-gray-500 italic">
                                                    Aucun modèle disponible
                                                </div>
                                            )}
                                            <div className="border-t border-gray-100 mt-1 pt-1">
                                                <button
                                                    onClick={() => navigate('/meeting-templates', { state: { returnTo: `/crm/meetings/${id}` } })}
                                                    className="block w-full text-left px-4 py-2 text-xs text-indigo-600 hover:bg-indigo-50 font-medium"
                                                >
                                                    Gérer les modèles
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 flex-1 prose max-w-none">
                            <Editor
                                data={initialEditorData || { blocks: [] }}
                                onChange={handleNotesSave}
                                readOnly={false} // Always editable
                            />

                            <AISummary
                                textToSummarize={extractTextFromBlocks(editorData.blocks)}
                                onSummaryGenerated={(summary) => {
                                    // Optional: could save summary to meeting notes or a separate field
                                    console.log("Summary generated:", summary);
                                }}
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
