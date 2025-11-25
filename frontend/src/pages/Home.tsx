import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Clock, CheckSquare, FileText } from 'lucide-react';

const Home: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await api.get('/dashboard/');
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div className="p-8">Chargement...</div>;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 18) return 'Bonjour';
        return 'Bonsoir';
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{getGreeting()}, Utilisateur</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Recent Pages */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                        <Clock className="w-5 h-5 text-indigo-500 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-800">Pages récentes</h2>
                    </div>
                    <div className="space-y-3">
                        {data?.recent_pages?.map((page: any) => (
                            <div
                                key={page.id}
                                onClick={() => navigate(`/pages/${page.id}`)}
                                className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                            >
                                <FileText className="w-4 h-4 text-gray-400 mr-3" />
                                <span className="text-sm text-gray-700 font-medium">{page.title}</span>
                                <span className="ml-auto text-xs text-gray-400">
                                    {new Date(page.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                        {(!data?.recent_pages || data.recent_pages.length === 0) && (
                            <p className="text-sm text-gray-500">Aucune page récente.</p>
                        )}
                    </div>
                </div>

                {/* My Tasks */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                        <CheckSquare className="w-5 h-5 text-green-500 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-800">Mes tâches</h2>
                    </div>
                    <div className="space-y-3">
                        {data?.my_tasks?.map((task: any) => (
                            <div
                                key={task.id}
                                className="flex items-center p-2 hover:bg-gray-50 rounded border-l-2 border-transparent hover:border-green-500 transition-all"
                            >
                                <div className={`w-2 h-2 rounded-full mr-3 ${task.priority === 'high' ? 'bg-red-500' :
                                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`} />
                                <div className="flex-1">
                                    <div className="text-sm text-gray-800 font-medium">{task.title}</div>
                                    <div className="text-xs text-gray-500">Échéance : {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</div>
                                </div>
                                <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-600 uppercase">
                                    {task.status}
                                </span>
                            </div>
                        ))}
                        {(!data?.my_tasks || data.my_tasks.length === 0) && (
                            <p className="text-sm text-gray-500">Aucune tâche en attente.</p>
                        )}
                    </div>
                </div>

                {/* Active Contracts */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                        <FileText className="w-5 h-5 text-blue-500 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-800">Contrats actifs</h2>
                    </div>
                    <div className="space-y-3">
                        {data?.active_contracts?.map((contract: any) => (
                            <div
                                key={contract.id}
                                onClick={() => navigate(`/crm/contracts/${contract.id}`)}
                                className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors border-l-2 border-transparent hover:border-blue-500"
                            >
                                <div className="flex-1">
                                    <div className="text-sm text-gray-800 font-medium">{contract.title}</div>
                                    <div className="text-xs text-gray-500">{contract.company}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                        {contract.amount ? `${Number(contract.amount).toLocaleString()} €` : '-'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Fin : {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '-'}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!data?.active_contracts || data.active_contracts.length === 0) && (
                            <p className="text-sm text-gray-500">Aucun contrat actif.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
