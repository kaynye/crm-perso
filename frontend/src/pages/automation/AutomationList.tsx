import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Plus, Trash2, Play, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AutomationList: React.FC = () => {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await api.get('/automation/rules/');
            if (response.data.results) {
                setRules(response.data.results);
            } else {
                setRules(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch automation rules", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
            try {
                await api.delete(`/automation/rules/${id}/`);
                fetchRules();
            } catch (error) {
                console.error("Failed to delete rule", error);
            }
        }
    };

    const getTriggerLabel = (model: string, event: string) => {
        const models: Record<string, string> = {
            'task': 'Tâche',
            'contract': 'Contrat',
            'meeting': 'Réunion'
        };
        const events: Record<string, string> = {
            'create': 'Création',
            'update': 'Mise à jour',
            'delete': 'Suppression'
        };
        return `${models[model] || model} - ${events[event] || event}`;
    };

    const getActionLabel = (type: string) => {
        const actions: Record<string, string> = {
            'send_email': 'Envoyer un email',
            'create_task': 'Créer une tâche',
            'update_field': 'Mettre à jour un champ'
        };
        return actions[type] || type;
    };

    if (loading) return <div className="p-8">Chargement...</div>;

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Automatisations</h1>
                    <p className="text-gray-500 mt-1">Gérez vos règles d'automatisation</p>
                </div>
                <Link
                    to="/automation/rules/new"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700"
                >
                    <Plus size={20} />
                    Nouvelle règle
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Déclencheur</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rules.map((rule) => (
                            <tr key={rule.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <Play size={12} className="mr-1" />
                                        {getTriggerLabel(rule.trigger_model, rule.trigger_event)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {rule.condition_field ? (
                                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                            {rule.condition_field} {rule.condition_operator || '=='} {rule.condition_value}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 italic">Toujours</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {getActionLabel(rule.action_type)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {rule.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-3">
                                        <Link to={`/automation/rules/${rule.id}`} className="text-indigo-600 hover:text-indigo-900">Modifier</Link>
                                        <button onClick={() => handleDelete(rule.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rules.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                        <p>Aucune règle d'automatisation définie.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AutomationList;
