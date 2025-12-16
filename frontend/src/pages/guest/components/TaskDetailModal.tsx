import React from 'react';
import { X, Clock, CheckCircle, AlignLeft } from 'lucide-react';
import { edjsParser } from '../utils/parsers';

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

export default TaskDetailModal;
