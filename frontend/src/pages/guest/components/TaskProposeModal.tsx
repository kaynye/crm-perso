
import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../../api/axios';
import Editor from '../../../components/Editor';
import type { OutputData } from '@editorjs/editorjs';

const TaskProposeModal: React.FC<{ token: string, authPassword?: string | null, onClose: () => void, onSuccess: () => void }> = ({ token, authPassword, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [editorData, setEditorData] = useState<OutputData>({ blocks: [] });
    const [priority, setPriority] = useState('medium');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const headers: any = {};
            if (authPassword) headers['X-Shared-Link-Password'] = authPassword;

            await api.post(`/crm/public/tasks/?token=${token}`, {
                title,
                description: JSON.stringify(editorData),
                priority
            }, { headers });
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden h-[80vh] flex flex-col">
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

export default TaskProposeModal;
