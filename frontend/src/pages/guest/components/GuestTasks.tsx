import React, { useState, useEffect } from 'react';
import { Plus, Layout, Calendar as CalendarIcon } from 'lucide-react';
import api from '../../../api/axios';
import GuestTaskCalendar from './GuestTaskCalendar';
import TaskDetailModal from './TaskDetailModal';
import TaskProposeModal from './TaskProposeModal';

const GuestTasks: React.FC<{ token: string, canPropose: boolean }> = ({ token, canPropose }) => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'board' | 'calendar'>('board');
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showProposeModal, setShowProposeModal] = useState(false);

    const fetchTasks = () => {
        setLoading(true);
        api.get(`/crm/public/tasks/?token=${token}`)
            .then(res => {
                if (Array.isArray(res.data)) setTasks(res.data);
                else if (res.data.results) setTasks(res.data.results);
                else setTasks([]);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTasks();
    }, [token]);

    if (loading) return <div className="p-4 text-center text-gray-500">Chargement des tâches...</div>;

    // Group by status
    const draft = tasks.filter(t => t.status === 'draft');
    const todo = tasks.filter(t => t.status === 'todo');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const done = tasks.filter(t => t.status === 'done');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                {canPropose && (
                    <button
                        onClick={() => setShowProposeModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                    >
                        <Plus size={16} /> Proposer une tâche
                    </button>
                )}
                {!canPropose && <div></div>} {/* Spacer */}

                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setView('board')}
                        className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${view === 'board' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Layout size={18} /> Tableau
                    </button>
                    <button
                        onClick={() => setView('calendar')}
                        className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <CalendarIcon size={18} /> Calendrier
                    </button>
                </div>
            </div>

            {view === 'calendar' ? (
                <GuestTaskCalendar tasks={tasks} onTaskClick={setSelectedTask} />
            ) : (
                <div className={`grid gap-6 ${draft.length > 0 ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                    {draft.length > 0 && (
                        <KanbanColumn title="Brouillon" items={draft} color="bg-gray-50 border border-dashed border-gray-300" dotColor="bg-gray-300" onTaskClick={setSelectedTask} />
                    )}
                    <KanbanColumn title="A Faire" items={todo} color="bg-gray-100" dotColor="bg-gray-400" onTaskClick={setSelectedTask} />
                    <KanbanColumn title="En Cours" items={inProgress} color="bg-blue-50" dotColor="bg-blue-400" onTaskClick={setSelectedTask} />
                    <KanbanColumn title="Terminé" items={done} color="bg-green-50" dotColor="bg-green-400" onTaskClick={setSelectedTask} />
                </div>
            )}

            {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
            {showProposeModal && <TaskProposeModal token={token} onClose={() => setShowProposeModal(false)} onSuccess={fetchTasks} />}
        </div>
    );
};

const KanbanColumn: React.FC<{ title: string, items: any[], color: string, dotColor: string, onTaskClick: (task: any) => void }> = ({ title, items, color, dotColor, onTaskClick }) => {
    return (
        <div className={`rounded-xl ${color} p-4 min-h-[500px]`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                    {title}
                </h3>
                <span className="text-xs font-medium text-gray-500 bg-white/50 px-2 py-1 rounded-full">{items.length}</span>
            </div>
            <div className="space-y-3">
                {items.map(task => (
                    <div
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:border-indigo-300 group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-600' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                    'bg-gray-100 text-gray-500'
                                }`}>
                                {task.priority}
                            </span>
                            {task.due_date && (
                                <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                    {new Date(task.due_date).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1 leading-snug group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm italic">Aucune tâche</div>
                )}
            </div>
        </div>
    )
}

export default GuestTasks;
