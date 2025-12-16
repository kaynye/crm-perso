import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../../../api/axios';
import { edjsParser, editorStyles } from '../utils/parsers';

import EditorJS from '@editorjs/editorjs';
// @ts-ignore
import Header from '@editorjs/header';
// @ts-ignore
import List from '@editorjs/list';
// @ts-ignore
import Table from '@editorjs/table';
// @ts-ignore
import Checklist from '@editorjs/checklist';
// @ts-ignore
import Delimiter from '@editorjs/delimiter';

const MeetingDetailModal: React.FC<{ meeting: any, onClose: () => void }> = ({ meeting, onClose }) => {
    let htmlContent: string | string[] = 'Pas de notes';
    try {
        if (meeting.notes && typeof meeting.notes === 'string') {
            const json = JSON.parse(meeting.notes);
            htmlContent = edjsParser.parse(json);
        }
    } catch (e) {
        htmlContent = meeting.notes || 'Pas de notes';
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                        <p className="text-sm text-gray-500">{new Date(meeting.date).toLocaleDateString()} - {new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
                </div>
                <div className="p-8 overflow-y-auto">
                    <div className="p-8 overflow-y-auto">
                        <div className={`prose prose-sm max-w-none text-gray-700 ${editorStyles}`}>
                            <div dangerouslySetInnerHTML={{ __html: Array.isArray(htmlContent) ? htmlContent.join('') : htmlContent }} className="editorjs-content" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MeetingProposeModal: React.FC<{ token: string, authPassword?: string | null, onClose: () => void, onSuccess: () => void }> = ({ token, authPassword, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState('video');
    const [submitting, setSubmitting] = useState(false);

    // EditorJS State
    const editorRef = React.useRef<EditorJS | null>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');



    // Initialize Editor
    useEffect(() => {
        const holderId = 'meeting-description-editor';

        if (!editorRef.current) {
            const editor = new EditorJS({
                holder: holderId,
                placeholder: 'Ordre du jour, notes préparatoires...',
                tools: {
                    header: Header,
                    list: { class: List, inlineToolbar: true },
                    table: { class: Table as any, inlineToolbar: true },
                    checklist: { class: Checklist, inlineToolbar: true },
                    delimiter: Delimiter
                },
                data: { blocks: [] },
                minHeight: 150,
            });
            editorRef.current = editor;
        }

        return () => {
            if (editorRef.current && typeof editorRef.current.destroy === 'function') {
                // We need to be careful with destroying immediately in strict mode
                // But usually, destroying is the safe way to allow re-creation
                try {
                    editorRef.current.destroy();
                    editorRef.current = null;
                } catch (e) {
                    console.error("Editor destroy error", e);
                }
            }
        };
    }, []);

    // Fetch Templates
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const headers: any = {};
                if (authPassword) headers['X-Shared-Link-Password'] = authPassword;

                const res = await api.get(`/crm/public/meeting-templates/?token=${token}`, { headers });
                if (Array.isArray(res.data)) setTemplates(res.data);
                else if (res.data.results) setTemplates(res.data.results);
            } catch (err) {
                console.error("Failed to fetch templates", err);
            }
        };
        fetchTemplates();
    }, [token, authPassword]);

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tplId = e.target.value;
        setSelectedTemplate(tplId);
        if (!tplId) return;

        const tpl = templates.find(t => t.id === tplId);
        if (tpl && tpl.content && editorRef.current) {
            try {
                const content = JSON.parse(tpl.content);
                editorRef.current.isReady.then(() => {
                    editorRef.current?.render(content);
                });
            } catch (err) {
                console.error("Failed to parse template content", err);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const savedData = await editorRef.current?.save();
            const headers: any = {};
            if (authPassword) headers['X-Shared-Link-Password'] = authPassword;

            await api.post(`/crm/public/meetings/?token=${token}`, {
                title,
                date: `${date}T${time}:00`,
                type,
                notes: JSON.stringify(savedData)
            }, { headers });
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la création de la réunion.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">Proposer une Réunion</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                            <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Ex: Point d'avancement" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
                                <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select value={type} onChange={e => setType(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                                <option value="video">Visioconférence</option>
                                <option value="phone">Téléphone</option>
                                <option value="person">Présentiel</option>
                            </select>
                        </div>

                        {/* Template Selection */}
                        {templates.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Modèle (Template)</label>
                                <select
                                    value={selectedTemplate}
                                    onChange={handleTemplateChange}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    <option value="">-- Sélectionner un modèle --</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Ordre du jour</label>
                            <div className="border border-gray-300 rounded-md p-2 min-h-[150px] bg-gray-50/50">
                                <div id="meeting-description-editor" className="prose prose-sm max-w-none"></div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                                {submitting ? 'Envoi...' : 'Proposer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const GuestMeetings: React.FC<{ token: string, canPropose: boolean, authPassword?: string | null }> = ({ token, canPropose, authPassword }) => {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<any>(null);

    const fetchMeetings = () => {
        setLoading(true);
        const headers: any = {};
        if (authPassword) headers['X-Shared-Link-Password'] = authPassword;

        api.get(`/crm/public/meetings/?token=${token}`, { headers })
            .then(res => {
                if (Array.isArray(res.data)) setMeetings(res.data);
                else if (res.data.results) setMeetings(res.data.results);
                else setMeetings([]);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchMeetings();
    }, [token, authPassword]);

    if (loading) return <div className="p-4 text-center text-gray-500">Chargement des réunions...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                {canPropose && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                    >
                        <Plus size={16} /> Proposer une réunion
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.map(meeting => (
                    <div
                        key={meeting.id}
                        onClick={() => setSelectedMeeting(meeting)}
                        className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col hover:border-indigo-300 transition-all cursor-pointer hover:shadow-md group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${meeting.type === 'video' ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-200' :
                                meeting.type === 'phone' ? 'bg-green-100 text-green-600 group-hover:bg-green-200' :
                                    'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                                }`}>
                                {/* Icon based on type */}
                                {meeting.type === 'video' ? '📹' : meeting.type === 'phone' ? '📞' : '👥'}
                            </div>
                            <div className="text-right">
                                <span className="block text-xs font-medium text-gray-900">
                                    {new Date(meeting.date).toLocaleDateString()}
                                </span>
                                <span className="block text-xs text-gray-500">
                                    {new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 truncate">{meeting.title}</h3>
                        <div className="mt-auto pt-4 border-t border-gray-100 text-center">
                            <span className="text-sm text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Voir les notes</span>
                        </div>
                    </div>
                ))}
                {meetings.length === 0 && <div className="col-span-full text-center text-gray-400 py-10">Aucune réunion trouvée.</div>}
            </div>

            {showModal && <MeetingProposeModal token={token} authPassword={authPassword} onClose={() => setShowModal(false)} onSuccess={fetchMeetings} />}
            {selectedMeeting && <MeetingDetailModal meeting={selectedMeeting} onClose={() => setSelectedMeeting(null)} />}
        </div>
    );
};

export default GuestMeetings;
