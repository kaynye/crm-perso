import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Plus, Trash2, Edit2, Save, ArrowLeft } from 'lucide-react';
import Editor from '../../components/Editor';
import type { OutputData } from '@editorjs/editorjs';
import { useLocation, useNavigate } from 'react-router-dom';

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
    const [initialEditorData, setInitialEditorData] = useState<OutputData>({ blocks: [] });

    const location = useLocation();
    const navigate = useNavigate();
    const returnTo = location.state?.returnTo;

    useEffect(() => {
        fetchTemplates();
    }, []);

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

    const handleEdit = (template: Template) => {
        setCurrentTemplate(template);
        try {
            const data = JSON.parse(template.content);
            setInitialEditorData(data);
            setEditorData(data);
        } catch (e) {
            const empty = { blocks: [] };
            setInitialEditorData(empty);
            setEditorData(empty);
        }
        setIsEditing(true);
    };

    const handleCreate = () => {
        setCurrentTemplate({ name: '' });
        const empty = { blocks: [] };
        setInitialEditorData(empty);
        setEditorData(empty);
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
            <div className="p-4 md:p-8 max-w-4xl mx-auto h-full flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                        {currentTemplate.id ? 'Modifier le modèle' : 'Nouveau modèle'}
                    </h1>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 text-center"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
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
                    <div className="p-4 md:p-6 flex-1 overflow-y-auto prose max-w-none">
                        <Editor
                            key={currentTemplate.id || 'new'} // Force re-mount on template switch
                            data={initialEditorData} // Use initial data to prevent re-renders on type
                            onChange={setEditorData}
                            readOnly={false}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        {returnTo && (
                            <button
                                onClick={() => navigate(returnTo)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Retour à la réunion"
                            >
                                <ArrowLeft size={24} />
                            </button>
                        )}
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Modèles de Réunion</h1>
                    </div>
                    <p className="mt-2 text-gray-600">Gérez les structures types pour vos comptes-rendus.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
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
                            Modèle personnalisé
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
