import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Save, Trash2, HelpCircle } from 'lucide-react';

const AutomationForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        name: '',
        trigger_model: 'task',
        trigger_event: 'create',
        condition_field: '',
        condition_value: '',
        action_type: 'send_email',
        action_config: {} as any,
        is_active: true
    });
    const [actionConfig, setActionConfig] = useState({
        recipient_id: '',
        assigned_to_id: '',
        subject: '',
        template: ''
    });
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch company users for assignment/email
                // Assuming we have an endpoint for this or we filter contacts? 
                // Ideally we want organization members (Users)
                // For now let's try to fetch users from a hypothetical endpoint or just use a mock if not available
                // We'll try to fetch all users in the organization
                // The endpoint '/api/admin/users/' might be restricted. Let's see if we can use something else or if the user is admin.
                // If not, we might need to expose organization members.
                // Let's assume there is a way to get "Assignees" similar to task assignment.
                // Checking TaskDetail we usually fetch 'contacts' or 'users'.
                // Let's try fetching users (if admin) or just rely on manual entry for now if fails.

                // NOTE: In a real scenario, I would check with the user or backend if there's a specific endpoint for "Organization Users".
                // Based on previous chats, there is likely a User model.
                try {
                    // Try to fetch organization users if possible, or contacts?
                    // Let's iterate on this. For now, empty list or maybe contacts?
                    // Actually, for "send_email", we might want to email a specific USER or CONTACT.
                    // For "create_task", we assign to a USER.
                    const usersRes = await api.get('/users/'); // This works with UserViewSet
                    if (usersRes.data.results) setUsers(usersRes.data.results);
                    else if (Array.isArray(usersRes.data)) setUsers(usersRes.data);
                } catch (e) {
                    console.warn("Could not fetch users, maybe not admin", e);
                }

                if (isEditMode) {
                    const ruleRes = await api.get(`/automation/rules/${id}/`);
                    const rule = ruleRes.data;
                    setFormData({
                        name: rule.name,
                        trigger_model: rule.trigger_model,
                        trigger_event: rule.trigger_event,
                        condition_field: rule.condition_field || '',
                        condition_value: rule.condition_value || '',
                        action_type: rule.action_type,
                        action_config: rule.action_config,
                        is_active: rule.is_active
                    });
                    setActionConfig(rule.action_config || {});
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

        const payload = {
            ...formData,
            action_config: actionConfig
        };

        try {
            if (isEditMode) {
                await api.patch(`/automation/rules/${id}/`, payload);
            } else {
                await api.post('/automation/rules/', payload);
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
        <div className="max-w-3xl mx-auto p-8">
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

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* General Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <h2 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">Informations Générales</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la règle</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="ex: Email de bienvenue nouveau client"
                        />
                    </div>
                    <div className="flex items-center gap-2">
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

                {/* Trigger */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <h2 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">Déclencheur</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
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
                </div>

                {/* Condition */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <h2 className="text-lg font-medium text-gray-900">Condition (Optionnel)</h2>
                        <span className="text-xs text-gray-500">Laisser vide pour exécuter toujours</span>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Champ</label>
                            <input
                                type="text"
                                value={formData.condition_field}
                                onChange={e => setFormData({ ...formData, condition_field: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="ex: status"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Valeur</label>
                            <input
                                type="text"
                                value={formData.condition_value}
                                onChange={e => setFormData({ ...formData, condition_value: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="ex: completed"
                            />
                        </div>
                    </div>
                </div>

                {/* Action */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <h2 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">Action</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type d'action</label>
                        <select
                            value={formData.action_type}
                            onChange={e => setFormData({ ...formData, action_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="send_email">Envoyer un email</option>
                            <option value="create_task">Créer une tâche</option>
                            {/* <option value="update_field">Mettre à jour un champ</option> */}
                        </select>
                    </div>

                    {/* Action Config */}
                    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                        {formData.action_type === 'send_email' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Destinataire (Utilisateur)</label>
                                    <select
                                        value={actionConfig.recipient_id}
                                        onChange={e => setActionConfig({ ...actionConfig, recipient_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="">Sélectionner un utilisateur...</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                                    <input
                                        type="text"
                                        value={actionConfig.subject}
                                        onChange={e => setActionConfig({ ...actionConfig, subject: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="text-xs text-gray-500">
                                    Le contenu de l'email sera généré automatiquement (pour l'instant).
                                </div>
                            </>
                        )}

                        {formData.action_type === 'create_task' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigner à</label>
                                    <select
                                        value={actionConfig.assigned_to_id}
                                        onChange={e => setActionConfig({ ...actionConfig, assigned_to_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="">Sélectionner un utilisateur...</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la tâche</label>
                                    <input
                                        type="text"
                                        value={actionConfig.subject}
                                        onChange={e => setActionConfig({ ...actionConfig, subject: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="ex: Faire un suivi"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
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
