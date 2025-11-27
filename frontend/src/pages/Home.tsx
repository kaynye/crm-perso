import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Clock, CheckSquare, FileText, TrendingUp, Users, AlertCircle } from 'lucide-react';
import RevenueChart from '../components/dashboard/RevenueChart';
import TaskDistributionChart from '../components/dashboard/TaskDistributionChart';
import SalesFunnelChart from '../components/dashboard/SalesFunnelChart';

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

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 18) return 'Bonjour';
        return 'Bonsoir';
    };

    // Calculate total revenue from chart data for the KPI card
    const totalRevenue = data?.analytics?.revenue?.reduce((acc: number, curr: any) => acc + curr.value, 0) || 0;
    const pendingTasks = data?.my_tasks?.length || 0;
    const activeContractsCount = data?.active_contracts?.length || 0;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">{getGreeting()}, Utilisateur</h1>
                <div className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
                    <div className="p-3 bg-indigo-100 rounded-lg mr-4">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Revenus (6 mois)</p>
                        <p className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString()} €</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg mr-4">
                        <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Contrats Actifs</p>
                        <p className="text-2xl font-bold text-gray-900">{activeContractsCount}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Tâches en attente</p>
                        <p className="text-2xl font-bold text-gray-900">{pendingTasks}</p>
                    </div>
                </div>
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart - Takes 2 columns */}
                <div className="lg:col-span-2">
                    {data?.analytics?.revenue && <RevenueChart data={data.analytics.revenue} />}
                </div>

                {/* Recent Activity / Tasks List (Keep a small list for quick access) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4 justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">Tâches Urgentes</h2>
                        <button onClick={() => navigate('/tasks')} className="text-sm text-indigo-600 hover:underline">Voir tout</button>
                    </div>
                    <div className="space-y-3">
                        {data?.my_tasks?.slice(0, 5).map((task: any) => (
                            <div key={task.id} className="flex items-center p-2 hover:bg-gray-50 rounded border-l-2 border-transparent hover:border-indigo-500 transition-all cursor-pointer" onClick={() => navigate('/tasks')}>
                                <div className={`w-2 h-2 rounded-full mr-3 ${task.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                                    <p className="text-xs text-gray-500">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Sans date'}</p>
                                </div>
                            </div>
                        ))}
                        {!data?.my_tasks?.length && <p className="text-sm text-gray-500">Rien à faire ! 🎉</p>}
                    </div>
                </div>
            </div>

            {/* Secondary Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {data?.analytics?.tasks && <TaskDistributionChart data={data.analytics.tasks} />}
                {data?.analytics?.funnel && <SalesFunnelChart data={data.analytics.funnel} />}
            </div>
        </div>
    );
};

export default Home;
