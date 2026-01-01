import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Plus, Trash2, Play, AlertCircle, FileText, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import AutomationLogs from './AutomationLogs';

const AutomationList: React.FC = () => {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules');

    useEffect(() => {
        if (activeTab === 'rules') {
            fetchRules();
        }
    }, [activeTab]);

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

    const getActionLabel = (actions: any[]) => {
        if (!actions || !actions.length) return 'Aucune action';
        if (actions.length === 1) {
            const type = actions[0].type;
            const labels: Record<string, string> = {
                'send_email': 'Email',
                'create_task': 'Tâche'
            };
            return labels[type] || type;
        }
        return `${actions.length} actions`;
    };

    const getConditionLabel = (conditions: any[]) => {
        if (!conditions || !conditions.length) return 'Toujours';
        return `${conditions.length} condition(s)`;
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Automatisations</h1>
                    <p className="text-gray-500 mt-1">Gérez vos règles et suivez leur exécution</p>
                </div>
                {activeTab === 'rules' && (
                    <Link
                        to="/automation/rules/new"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700"
                    >
                        <Plus size={20} />
                        Nouvelle règle
                    </Link>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'rules'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    <List size={18} />
                    Règles
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'logs'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    <FileText size={18} />
                    Historique
                </button>
            </div>

            {activeTab === 'logs' ? (
                <AutomationLogs />
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-8">Chargement...</div>
                    ) : (
                        <>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Déclencheur</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conditions</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                                                {getConditionLabel(rule.conditions)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {getActionLabel(rule.actions)}
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
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default AutomationList;
