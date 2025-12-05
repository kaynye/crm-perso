import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Plus, Trash2, Edit2, Save } from 'lucide-react';
import Editor from '../../components/Editor';
import type { OutputData } from '@editorjs/editorjs';

interface Template {
    id: string;
    name: string;
    content: string; // JSON string
}

const MeetingTemplates: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<Partial<Template>>({});
    const [editorData, setEditorData] = useState<OutputData>({ blocks: [] });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/crm/meeting-templates/');
            setTemplates(response.data);
        } catch (error) {
            console.error("Failed to fetch templates", error);
        }
    };

    const handleEdit = (template: Template) => {
        setCurrentTemplate(template);
        try {
            setEditorData(JSON.parse(template.content));
        } catch (e) {
            setEditorData({ blocks: [] });
        }
        setIsEditing(true);
    };

    const handleCreate = () => {
        setCurrentTemplate({ name: '' });
        setEditorData({ blocks: [] });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!currentTemplate.name) return alert("Le nom est requis");

        try {
            const payload = {
                name: currentTemplate.name,
                content: JSON.stringify(editorData)
            };

            if (currentTemplate.id) {
                await api.patch(`/crm/meeting-templates/${currentTemplate.id}/`, payload);
            } else {
                await api.post('/crm/meeting-templates/', payload);
            }

            setIsEditing(false);
            fetchTemplates();
        } catch (error) {
            console.error("Failed to save template", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Supprimer ce modèle ?")) return;
        try {
            await api.delete(`/crm/meeting-templates/${id}/`);
            fetchTemplates();
        } catch (error) {
            console.error("Failed to delete template", error);
        }
    };

    if (isEditing) {
        return (
            <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {currentTemplate.id ? 'Modifier le modèle' : 'Nouveau modèle'}
                    </h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                        >
                            <Save size={16} />
                            Enregistrer
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du modèle</label>
                    <input
                        type="text"
                        value={currentTemplate.name || ''}
                        onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Ex: Appel de découverte"
                    />
                </div>

                <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-medium text-gray-900">Contenu du modèle</h3>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto prose max-w-none">
                        <Editor
                            data={editorData}
                            onChange={setEditorData}
                            readOnly={false}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Modèles de Réunion</h1>
                    <p className="mt-2 text-gray-600">Gérez les structures types pour vos comptes-rendus.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                    <Plus size={16} />
                    Nouveau modèle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <div key={template.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:border-indigo-500 transition-colors">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{template.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Créé le {new Date().toLocaleDateString()} {/* Date field not in initial fetch, assuming for now */}
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => handleEdit(template)}
                                className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(template.id)}
                                className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {templates.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                        <p className="text-gray-500">Aucun modèle créé.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeetingTemplates;
