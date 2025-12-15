import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import GuestLayout from '../../components/GuestLayout';
import { Calendar as CalendarIcon, Layout, X, Clock, AlignLeft, CheckCircle, Plus } from 'lucide-react';
import edjsHTML from 'editorjs-html';

// Custom Parsers for EditorJS
const customParsers = {
    table: (block: any) => {
        const rows = block.data.content.map((row: string[], index: number) => {
            const isHeader = block.data.withHeadings && index === 0;
            const cellType = isHeader ? 'th' : 'td';
            return `<tr class="${isHeader ? 'bg-gray-50' : ''}">${row.map(cell => `<${cellType}>${cell}</${cellType}>`).join('')}</tr>`;
        }).join('');
        return `<div class="editorjs-table-wrapper"><table><tbody>${rows}</tbody></table></div>`;
    },
    list: (block: any) => {
        const type = block.data.style === 'ordered' ? 'ol' : 'ul';
        const items = block.data.items.map((item: any) => {
            const text = typeof item === 'string' ? item : (item.content || item.text || '');
            return `<li>${text}</li>`;
        }).join('');
        return `<${type}>${items}</${type}>`;
    },
    checklist: (block: any) => {
        const items = block.data.items.map((item: any) =>
            `<div class="checklist-item"><input type="checkbox" ${item.checked ? 'checked' : ''} disabled> <span>${item.text}</span></div>`
        ).join('');
        return `<div class="checklist">${items}</div>`;
    },
    header: (block: any) => {
        return `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
    },
    delimiter: () => {
        return `<hr class="ce-delimiter" />`;
    },
    // Fallback for unknown blocks to avoid crashes
    image: (block: any) => {
        return `<img src="${block.data.file?.url || block.data.url}" alt="${block.data.caption || ''}" />`;
    }
};

const edjsParser = edjsHTML(customParsers);

interface Config {
    title: string;
    type: string;
    company_name: string;
    permissions: {
        allow_tasks: boolean;
        allow_task_creation: boolean;
        allow_meetings: boolean;
        allow_documents: boolean;
    };
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const SharedView: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/crm/public/config/?token=${token}`);
                setConfig(response.data);

                // Set default active tab
                const perms = response.data.permissions;
                if (perms.allow_tasks) setActiveTab('tasks');
                else if (perms.allow_meetings) setActiveTab('meetings');
                else if (perms.allow_documents) setActiveTab('documents');

            } catch (err) {
                console.error(err);
                setError('Lien invalide ou expiré.');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchConfig();
        }
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !config) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="text-red-500 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{error || 'Une erreur est survenue'}</h2>
                <p className="text-gray-500 mt-2 text-center">Veuillez demander un nouveau lien.</p>
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'tasks':
                return <GuestTasks token={token!} canPropose={config?.permissions.allow_task_creation || false} />;
            case 'meetings':
                return <GuestMeetings token={token!} />;
            case 'documents':
                return <GuestDocuments token={token!} />;
            default:
                return <div>Sélectionnez un onglet</div>;
        }
    };

    return (
        <GuestLayout title={config.title} subtitle={config.company_name}>
            <style>{_styles}</style>
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {config.permissions.allow_tasks && (
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`${activeTab === 'tasks'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Tâches & Planning
                        </button>
                    )}
                    {config.permissions.allow_meetings && (
                        <button
                            onClick={() => setActiveTab('meetings')}
                            className={`${activeTab === 'meetings'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Réunions
                        </button>
                    )}
                    {config.permissions.allow_documents && (
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`${activeTab === 'documents'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Documents
                        </button>
                    )}
                </nav>
            </div>

            <div className="min-h-[400px]">
                {renderTabContent()}
            </div>
        </GuestLayout>
    );
};

// --- Sub-components ---

// Simple Custom Calendar View
const GuestTaskCalendar: React.FC<{ tasks: any[], onTaskClick: (task: any) => void }> = ({ tasks, onTaskClick }) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const getTasksForDate = (day: number) => {
        return tasks.filter(t => {
            if (!t.due_date) return false;
            const d = new Date(t.due_date);
            return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">{monthNames[currentMonth]} {currentYear}</h3>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-1 px-3 border rounded hover:bg-gray-50 text-sm">Préc</button>
                    <button onClick={nextMonth} className="p-1 px-3 border rounded hover:bg-gray-50 text-sm">Suiv</button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(d => (
                    <div key={d} className="bg-gray-50 text-center py-2 text-xs font-semibold text-gray-500 uppercase">{d}</div>
                ))}
                {/* Empty slots for start of month */}
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-white h-32"></div>
                ))}
                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayTasks = getTasksForDate(day);
                    return (
                        <div key={day} className="bg-white h-32 p-2 border-t border-gray-100 relative group hover:bg-gray-50 transition-colors">
                            <span className={`text-sm font-medium ${dayTasks.length > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>{day}</span>
                            <div className="mt-1 space-y-1 overflow-y-auto max-h-[90px] scrollbar-hide">
                                {dayTasks.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => onTaskClick(t)}
                                        className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate ${t.status === 'done' ? 'bg-green-100 text-green-700 line-through opacity-70' :
                                            'bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100'
                                            }`}
                                    >
                                        {t.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TaskDetailModal: React.FC<{ task: any, onClose: () => void }> = ({ task, onClose }) => {
    if (!task) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
                <div className="p-6 md:p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide mb-2 ${task.status === 'done' ? 'bg-green-100 text-green-800' :
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {task.status.replace('_', ' ')}
                            </span>
                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">{task.title}</h2>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Meta Grid */}
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock size={12} /> Échéance</label>
                                <p className="text-sm font-medium text-gray-900">{task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Non définie'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><CheckCircle size={12} /> Priorité</label>
                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold capitalize ${task.priority === 'high' ? 'bg-red-50 text-red-600' :
                                    task.priority === 'low' ? 'bg-gray-200 text-gray-600' :
                                        'bg-orange-50 text-orange-600'
                                    }`}>
                                    {task.priority || 'Moyenne'}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><AlignLeft size={12} /> Description</label>
                            <div className="prose prose-sm text-gray-700 leading-relaxed bg-white max-w-none">
                                {task.description ? (
                                    (() => {
                                        try {
                                            const parsed = JSON.parse(task.description);
                                            if (parsed.blocks) {
                                                const html = edjsParser.parse(parsed) as any; // Cast to avoid TS error if types are missing/wrong
                                                const htmlString = Array.isArray(html) ? html.join('') : html;
                                                return <div dangerouslySetInnerHTML={{ __html: htmlString }} className="editorjs-content" />;
                                            }
                                            return <p className="whitespace-pre-wrap">{task.description}</p>;
                                        } catch (e) {
                                            return <p className="whitespace-pre-wrap">{task.description}</p>;
                                        }
                                    })()
                                ) : (
                                    <p className="text-gray-400 italic">Aucune description.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

import Editor from '../../components/Editor';
import type { OutputData } from '@editorjs/editorjs';

const TaskProposeModal: React.FC<{ token: string, onClose: () => void, onSuccess: () => void }> = ({ token, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [editorData, setEditorData] = useState<OutputData>({ blocks: [] });
    const [priority, setPriority] = useState('medium');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(`${BASE_URL}/crm/public/tasks/?token=${token}`, {
                title,
                description: JSON.stringify(editorData),
                priority
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la création de la tâche.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in h-[80vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900">Proposer une Tâche</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4 h-full flex flex-col">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                                <input
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Ex: Réviser le contrat..."
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                                <select
                                    value={priority}
                                    onChange={e => setPriority(e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    <option value="low">Basse</option>
                                    <option value="medium">Moyenne</option>
                                    <option value="high">Haute</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <div className="flex-1 border border-gray-200 rounded-lg overflow-y-auto bg-gray-50/30 p-4">
                                <Editor
                                    data={editorData}
                                    onChange={setEditorData}
                                    holderId="guest-task-editor"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 flex-shrink-0">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {submitting ? 'Envoi...' : 'Soumettre'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const GuestTasks: React.FC<{ token: string, canPropose: boolean }> = ({ token, canPropose }) => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'board' | 'calendar'>('board');
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showProposeModal, setShowProposeModal] = useState(false);

    const fetchTasks = () => {
        setLoading(true);
        axios.get(`${BASE_URL}/crm/public/tasks/?token=${token}`)
            .then(res => {
                if (Array.isArray(res.data)) setTasks(res.data);
                else if (res.data.results) setTasks(res.data.results);
                else setTasks([]);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTasks();
    }, [token]);

    if (loading) return <div className="p-4 text-center text-gray-500">Chargement des tâches...</div>;

    // Group by status
    const draft = tasks.filter(t => t.status === 'draft');
    const todo = tasks.filter(t => t.status === 'todo');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const done = tasks.filter(t => t.status === 'done');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                {canPropose && (
                    <button
                        onClick={() => setShowProposeModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                    >
                        <Plus size={16} /> Proposer une tâche
                    </button>
                )}
                {!canPropose && <div></div>} {/* Spacer */}

                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setView('board')}
                        className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${view === 'board' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Layout size={18} /> Tableau
                    </button>
                    <button
                        onClick={() => setView('calendar')}
                        className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <CalendarIcon size={18} /> Calendrier
                    </button>
                </div>
            </div>

            {view === 'calendar' ? (
                <GuestTaskCalendar tasks={tasks} onTaskClick={setSelectedTask} />
            ) : (
                <div className={`grid gap-6 ${draft.length > 0 ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                    {draft.length > 0 && (
                        <KanbanColumn title="Brouillon" items={draft} color="bg-gray-50 border border-dashed border-gray-300" dotColor="bg-gray-300" onTaskClick={setSelectedTask} />
                    )}
                    <KanbanColumn title="A Faire" items={todo} color="bg-gray-100" dotColor="bg-gray-400" onTaskClick={setSelectedTask} />
                    <KanbanColumn title="En Cours" items={inProgress} color="bg-blue-50" dotColor="bg-blue-400" onTaskClick={setSelectedTask} />
                    <KanbanColumn title="Terminé" items={done} color="bg-green-50" dotColor="bg-green-400" onTaskClick={setSelectedTask} />
                </div>
            )}

            {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
            {showProposeModal && <TaskProposeModal token={token} onClose={() => setShowProposeModal(false)} onSuccess={fetchTasks} />}
        </div>
    );
};

const KanbanColumn: React.FC<{ title: string, items: any[], color: string, dotColor: string, onTaskClick: (task: any) => void }> = ({ title, items, color, dotColor, onTaskClick }) => {
    return (
        <div className={`rounded-xl ${color} p-4 min-h-[500px]`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                    {title}
                </h3>
                <span className="text-xs font-medium text-gray-500 bg-white/50 px-2 py-1 rounded-full">{items.length}</span>
            </div>
            <div className="space-y-3">
                {items.map(task => (
                    <div
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:border-indigo-300 group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-600' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                    'bg-gray-100 text-gray-500'
                                }`}>
                                {task.priority}
                            </span>
                            {task.due_date && (
                                <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                    {new Date(task.due_date).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1 leading-snug group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm italic">Aucune tâche</div>
                )}
            </div>
        </div>
    )
}

const GuestMeetings: React.FC<{ token: string }> = ({ token }) => {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${BASE_URL}/crm/public/meetings/?token=${token}`)
            .then(res => {
                if (Array.isArray(res.data)) setMeetings(res.data);
                else if (res.data.results) setMeetings(res.data.results);
                else setMeetings([]);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <div className="p-4 text-center text-gray-500">Chargement des réunions...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map(meeting => (
                <div key={meeting.id} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${meeting.type === 'video' ? 'bg-purple-100 text-purple-600' :
                            meeting.type === 'phone' ? 'bg-green-100 text-green-600' :
                                'bg-blue-100 text-blue-600'
                            }`}>
                            {/* Icon based on type */}
                            {meeting.type === 'video' ? '📹' : meeting.type === 'phone' ? '📞' : '👥'}
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                            {new Date(meeting.date).toLocaleDateString()}
                        </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{meeting.title}</h3>
                    <div className="text-sm text-gray-500 flex-1">
                        {/* Summary or snippet notes (JSON parsing needed ideally, simplified here) */}
                        <div className="prose prose-sm max-w-none line-clamp-3">
                            {meeting.notes && typeof meeting.notes === 'string' && meeting.notes.startsWith('{') ? 'Notes disponibles dans le portail' : meeting.notes || 'Pas de notes'}
                        </div>
                    </div>
                </div>
            ))}
            {meetings.length === 0 && <div className="col-span-full text-center text-gray-400 py-10">Aucune réunion trouvée.</div>}
        </div>
    );
};

const GuestDocuments: React.FC<{ token: string }> = ({ token }) => {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${BASE_URL}/crm/public/documents/?token=${token}`)
            .then(res => {
                if (Array.isArray(res.data)) setDocs(res.data);
                else if (res.data.results) setDocs(res.data.results);
                else setDocs([]);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <div className="p-4 text-center text-gray-500">Chargement des documents...</div>;

    return (
        <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Nom</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date d'ajout</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Télécharger</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {docs.map((doc) => (
                        <tr key={doc.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 flex items-center gap-2">
                                📄 {doc.name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {new Date(doc.uploaded_at).toLocaleDateString()}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <a href={doc.file} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-900 hover:underline">Télécharger<span className="sr-only">, {doc.name}</span></a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {docs.length === 0 && <div className="p-8 text-center text-gray-400">Aucun document disponible.</div>}
        </div>
    );
};

// --- Styles ---
// Add this simple style block or ensure your tailwind prose config covers these
// We need to ensure tables from editorjs look good
const _styles = `
.editorjs-content h1 { font-size: 1.5em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
.editorjs-content h2 { font-size: 1.25em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
.editorjs-content h3 { font-size: 1.1em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
.editorjs-content ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
.editorjs-content ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
.editorjs-content table { width: 100%; border-collapse: collapse; margin-bottom: 1em; table-layout: fixed; }
.editorjs-content td, .editorjs-content th { border: 1px solid #e5e7eb; padding: 0.5em; word-wrap: break-word; }
.editorjs-content th { background-color: #f9fafb; font-weight: 600; }
.editorjs-content .checklist-item { display: flex; align-items: center; gap: 0.5em; margin-bottom: 0.25em; }
.editorjs-content .ce-delimiter { border: 0; border-bottom: 1px solid #e5e7eb; margin: 1em 0; }
.editorjs-content img { max-width: 100%; border-radius: 0.5em; margin: 1em 0; }
`;

export default SharedView;
