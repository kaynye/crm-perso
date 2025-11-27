import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Plus, X } from 'lucide-react';
import ActionsMenu from '../../components/ActionsMenu';
import TaskDetail from './TaskDetail';

interface TaskBoardProps {
    filter?: Record<string, any>;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ filter }) => {
    const [tasks, setTasks] = useState<any>({ todo: [], in_progress: [], done: [] });
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');

    useEffect(() => {
        fetchTasks();
    }, [filter]);

    const fetchTasks = async () => {
        try {
            const params = filter ? new URLSearchParams(filter).toString() : '';
            const response = await api.get(`/tasks/kanban/?${params}`);
            setTasks(response.data);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskTitle) {
            try {
                await api.post('/tasks/', {
                    title: newTaskTitle,
                    status: 'todo',
                    priority: newTaskPriority,
                    ...filter
                });
                fetchTasks();
                setNewTaskTitle('');
                setNewTaskPriority('medium');
                setIsNewTaskModalOpen(false);
            } catch (error) {
                console.error("Failed to create task", error);
            }
        }
    };

    const deleteTask = async (id: string) => {
        try {
            await api.delete(`/tasks/${id}/`);
            fetchTasks();
            if (selectedTaskId === id) setSelectedTaskId(null);
        } catch (error) {
            console.error("Failed to delete task", error);
        }
    };

    const updateTaskStatus = async (taskId: string, newStatus: string) => {
        try {
            await api.patch(`/tasks/${taskId}/`, { status: newStatus });
            fetchTasks();
        } catch (error) {
            console.error("Failed to update task", error);
        }
    };

    const onDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDrop = (e: React.DragEvent, status: string) => {
        const taskId = e.dataTransfer.getData("taskId");
        updateTaskStatus(taskId, status);
    };

    const renameTask = async (task: any) => {
        const newTitle = prompt("Renommer la tâche :", task.title);
        if (newTitle && newTitle !== task.title) {
            try {
                await api.patch(`/tasks/${task.id}/`, { title: newTitle });
                fetchTasks();
            } catch (error) {
                console.error("Failed to rename task", error);
            }
        }
    };

    const Column = ({ title, status, items }: { title: string, status: string, items: any[] }) => (
        <div
            className="bg-gray-50/80 p-4 rounded-xl min-w-[85vw] md:min-w-0 md:w-1/3 mx-2 flex flex-col h-full border border-gray-100 snap-center"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, status)}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700 text-sm tracking-tight">{title}</h3>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">{items.length}</span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {items.map((task) => (
                    <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, task.id)}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-move hover:shadow-md transition-all duration-200 relative group"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                            {task.priority === 'high' && (
                                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" title="Priorité Haute" />
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                            {task.assigned_to_name && (
                                <div className="flex items-center bg-indigo-50 px-2 py-0.5 rounded-full">
                                    <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-600 font-bold mr-1">
                                        {task.assigned_to_name.charAt(0)}
                                    </div>
                                    <span className="text-xs text-indigo-700">{task.assigned_to_name}</span>
                                </div>
                            )}
                            {task.category && (
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                                    {task.category}
                                </span>
                            )}
                            {task.due_date && (
                                <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                                    {new Date(task.due_date).toLocaleDateString('fr-FR')}
                                </span>
                            )}
                            {task.company_name && (
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 flex items-center">
                                    <span className="w-1 h-1 rounded-full bg-blue-400 mr-1"></span>
                                    {task.company_name}
                                </span>
                            )}
                        </div>

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <ActionsMenu onEdit={() => renameTask(task)} onDelete={() => deleteTask(task.id)} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 h-full flex flex-col bg-white">
            <div className="flex justify-between items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Tableau des Tâches</h1>
                <button onClick={() => setIsNewTaskModalOpen(true)} className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm text-sm font-medium">
                    <Plus size={16} className="mr-2" />
                    Nouvelle Tâche
                </button>
            </div>

            <div className="flex flex-1 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory">
                <Column title="À faire" status="todo" items={tasks.todo || []} />
                <Column title="En cours" status="in_progress" items={tasks.in_progress || []} />
                <Column title="Terminé" status="done" items={tasks.done || []} />
            </div>

            {/* Task Detail Sidebar/Modal */}
            {selectedTaskId && (
                <TaskDetail
                    taskId={selectedTaskId}
                    onClose={() => setSelectedTaskId(null)}
                    onUpdate={fetchTasks}
                />
            )}

            {/* New Task Modal */}
            {isNewTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Nouvelle Tâche</h2>
                            <button onClick={() => setIsNewTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTask}>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Que faut-il faire ?"
                                className="w-full border border-gray-200 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                            />
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setNewTaskPriority(p)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${newTaskPriority === p
                                                ? p === 'high' ? 'bg-red-100 text-red-800 border-red-200'
                                                    : p === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                        : 'bg-green-100 text-green-800 border-green-200'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            {p === 'low' ? 'Basse' : p === 'medium' ? 'Moyenne' : 'Haute'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setIsNewTaskModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newTaskTitle.trim()}
                                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Créer la tâche
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskBoard;
