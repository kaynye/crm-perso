import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { AlertCircle, CheckCircle, XCircle, Filter, RefreshCw } from 'lucide-react';

const AutomationLogs: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [dateFilter, setDateFilter] = useState<string>(''); // 'today', '7d', '30d'

    useEffect(() => {
        fetchLogs();
    }, [statusFilter, dateFilter]); // Re-fetch on filter change

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // Apply filtering (Backend usually preferred, but for now client-side filtering or prepare backend params)
            // If backend doesn't support query params yet, we filter client side after fetch, or update backend ViewSet.
            // Assumption: Backend AutomationLogViewSet is standard GenericViewset, supports basic filtering if configured.
            // For robust filtering we'd add django-filter backend. For now, let's filter client side or basic params.

            const response = await api.get('/automation/logs/');
            let data = response.data.results || response.data;

            if (Array.isArray(data)) {
                if (statusFilter) {
                    data = data.filter((l: any) => l.status === statusFilter);
                }

                if (dateFilter) {
                    const now = new Date();
                    const cutoff = new Date();
                    if (dateFilter === 'today') cutoff.setHours(0, 0, 0, 0);
                    if (dateFilter === '7d') cutoff.setDate(now.getDate() - 7);
                    if (dateFilter === '30d') cutoff.setDate(now.getDate() - 30);

                    data = data.filter((l: any) => new Date(l.created_at) >= cutoff);
                }
            }

            setLogs(data);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        if (status === 'success') return <CheckCircle size={16} className="text-green-500" />;
        if (status === 'failed') return <XCircle size={16} className="text-red-500" />;
        return <AlertCircle size={16} className="text-yellow-500" />;
    };

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <Filter size={16} />
                        Filtres:
                    </div>

                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="success">Succès</option>
                        <option value="failed">Échec</option>
                    </select>

                    <select
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Toutes les dates</option>
                        <option value="today">Aujourd'hui</option>
                        <option value="7d">7 derniers jours</option>
                        <option value="30d">30 derniers jours</option>
                    </select>
                </div>

                <button
                    onClick={() => fetchLogs()}
                    className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors"
                    title="Rafraîchir"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Règle</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cible</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {!loading && logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(log.created_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {log.rule_name || 'Règle supprimée'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {log.target_model} #{log.target_id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5 text-sm">
                                        {getStatusIcon(log.status)}
                                        <span className="capitalize">{log.status}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={log.details}>
                                    {log.details}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && logs.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        <p>Aucun historique trouvé pour ces critères.</p>
                    </div>
                )}
                {loading && (
                    <div className="p-8 text-center text-gray-500">
                        <p>Chargement...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AutomationLogs;
