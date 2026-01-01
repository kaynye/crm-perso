import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import ConditionsBuilder from './components/ConditionsBuilder';
import ActionsBuilder from './components/ActionsBuilder';

const AutomationForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        name: '',
        trigger_model: 'task',
        trigger_event: 'create',
        conditions: [] as any[],
        actions: [] as any[],
        is_active: true
    });

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                try {
                    const usersRes = await api.get('/users/');
                    if (usersRes.data.results) setUsers(usersRes.data.results);
                    else if (Array.isArray(usersRes.data)) setUsers(usersRes.data);
                } catch (e) {
                    console.warn("Could not fetch users", e);
                }

                if (isEditMode) {
                    const ruleRes = await api.get(`/automation/rules/${id}/`);
                    const rule = ruleRes.data;
                    setFormData({
                        name: rule.name,
                        trigger_model: rule.trigger_model,
                        trigger_event: rule.trigger_event,
                        conditions: rule.conditions || [],
                        actions: rule.actions || [],
                        is_active: rule.is_active
                    });
                }
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditMode) {
                await api.patch(`/automation/rules/${id}/`, formData);
            } else {
                await api.post('/automation/rules/', formData);
            }
            navigate('/automation/rules');
        } catch (error) {
            console.error("Failed to save rule", error);
            alert("Échec de l'enregistrement de la règle");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
            try {
                await api.delete(`/automation/rules/${id}/`);
                navigate('/automation/rules');
            } catch (error) {
                console.error("Failed to delete rule", error);
            }
        }
    };

    if (initialLoading) return <div className="p-8">Chargement...</div>;

    return (
        <div className="max-w-4xl mx-auto p-8 pb-32">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditMode ? 'Modifier la règle' : 'Nouvelle règle'}
                    </h1>
                </div>
                {isEditMode && (
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100"
                    >
                        <Trash2 size={16} />
                        Supprimer
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* General Info */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <h2 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">1. Informations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la règle</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="ex: Email de bienvenue"
                            />
                        </div>
                        <div className="flex items-center pt-6">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                Règle active
                            </label>
                        </div>
                    </div>
                </section>

                {/* Trigger */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <h2 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">2. Déclencheur</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Modèle Cible</label>
                            <select
                                value={formData.trigger_model}
                                onChange={e => setFormData({ ...formData, trigger_model: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="task">Tâche</option>
                                <option value="contract">Contrat</option>
                                <option value="meeting">Réunion</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Événement</label>
                            <select
                                value={formData.trigger_event}
                                onChange={e => setFormData({ ...formData, trigger_event: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="create">Création</option>
                                <option value="update">Mise à jour</option>
                                <option value="delete">Suppression</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Conditions (Advanced) */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <div className="border-b border-gray-100 pb-2">
                        <h2 className="text-lg font-medium text-gray-900">3. Conditions (Optionnel)</h2>
                        <p className="text-sm text-gray-500 mt-1">La règle s'exécutera seulement si TOUTES ces conditions sont remplies.</p>
                    </div>

                    <ConditionsBuilder
                        conditions={formData.conditions}
                        onChange={conds => setFormData({ ...formData, conditions: conds })}
                    />
                </section>

                {/* Actions (Multiple) */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <div className="border-b border-gray-100 pb-2">
                        <h2 className="text-lg font-medium text-gray-900">4. Actions</h2>
                        <p className="text-sm text-gray-500 mt-1">Liste des actions à exécuter en séquence.</p>
                    </div>

                    <ActionsBuilder
                        actions={formData.actions}
                        onChange={acts => setFormData({ ...formData, actions: acts })}
                        users={users}
                        triggerModel={formData.trigger_model}
                    />
                </section>

                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <button
                        type="button"
                        onClick={() => navigate('/automation/rules')}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                    >
                        <Save size={18} />
                        {loading ? 'Enregistrement...' : 'Enregistrer la règle'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AutomationForm;
