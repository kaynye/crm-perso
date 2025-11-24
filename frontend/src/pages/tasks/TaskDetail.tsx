import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Editor from '../../components/Editor';
import { X, Calendar, User, Tag, CheckCircle } from 'lucide-react';

import type { OutputData } from '@editorjs/editorjs';

interface TaskDetailProps {
    taskId: string;
    onClose: () => void;
    onUpdate: () => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId, onClose, onUpdate }) => {
    const [task, setTask] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editorData, setEditorData] = useState<OutputData>({ blocks: [] });

    useEffect(() => {
        fetchTask();
        fetchUsers();
    }, [taskId]);

    const fetchTask = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/tasks/${taskId}/`);
            setTask(response.data);

            try {
                const parsed = JSON.parse(response.data.description || '{}');
                if (parsed.blocks) {
                    setEditorData(parsed);
                }
            } catch (e) {
                console.error("Failed to parse description", e);
            }
        } catch (error) {
            console.error("Failed to fetch task", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/');
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const handleSaveField = async (field: string, value: any) => {
        try {
            const updatedTask = { ...task, [field]: value };
            setTask(updatedTask);
            await api.patch(`/tasks/${taskId}/`, { [field]: value });
            onUpdate();
        } catch (error) {
            console.error(`Failed to update ${field}`, error);
        }
    };

    const handleDescriptionSave = async (data: OutputData) => {
        try {
            await api.patch(`/tasks/${taskId}/`, { description: JSON.stringify(data) });
            // onUpdate(); // Optional: might be too frequent
        } catch (error) {
            console.error("Failed to save description", error);
        }
    };

    if (loading) return null;
    if (!task) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

            {/* Sidebar */}
            <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start">
                    <div className="flex-1 mr-4">
                        <input
                            className="text-2xl font-bold text-gray-900 w-full border-none focus:outline-none focus:ring-0 placeholder-gray-300 bg-transparent p-0"
                            value={task.title}
                            onChange={(e) => setTask({ ...task, title: e.target.value })}
                            onBlur={(e) => handleSaveField('title', e.target.value)}
                        />
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>

                {/* Properties */}
                <div className="px-6 py-6 border-b border-gray-100 space-y-4 bg-gray-50/50">
                    {/* Status */}
                    <div className="flex items-center">
                        <div className="w-32 flex items-center text-gray-500 text-sm">
                            <CheckCircle size={16} className="mr-2" /> Statut
                        </div>
                        <select
                            className="bg-transparent border-none text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer hover:bg-gray-100 rounded px-2 py-1 -ml-2"
                            value={task.status}
                            onChange={(e) => handleSaveField('status', e.target.value)}
                        >
                            <option value="todo">À faire</option>
                            <option value="in_progress">En cours</option>
                            <option value="done">Terminé</option>
                        </select>
                    </div>

                    {/* Assigned To */}
                    <div className="flex items-center">
                        <div className="w-32 flex items-center text-gray-500 text-sm">
                            <User size={16} className="mr-2" /> Assigné à
                        </div>
                        <select
                            className="bg-transparent border-none text-sm text-gray-900 focus:ring-0 cursor-pointer hover:bg-gray-100 rounded px-2 py-1 -ml-2 w-48"
                            value={task.assigned_to || ''}
                            onChange={(e) => handleSaveField('assigned_to', e.target.value || null)}
                        >
                            <option value="">Non assigné</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.username}</option>
                            ))}
                        </select>
                    </div>

                    {/* Due Date */}
                    <div className="flex items-center">
                        <div className="w-32 flex items-center text-gray-500 text-sm">
                            <Calendar size={16} className="mr-2" /> Date d'échéance
                        </div>
                        <input
                            type="date"
                            className="bg-transparent border-none text-sm text-gray-900 focus:ring-0 cursor-pointer hover:bg-gray-100 rounded px-2 py-1 -ml-2"
                            value={task.due_date ? task.due_date.split('T')[0] : ''}
                            onChange={(e) => handleSaveField('due_date', e.target.value || null)}
                        />
                    </div>

                    {/* Category */}
                    <div className="flex items-center">
                        <div className="w-32 flex items-center text-gray-500 text-sm">
                            <Tag size={16} className="mr-2" /> Catégorie
                        </div>
                        <input
                            type="text"
                            placeholder="Ajouter une catégorie..."
                            className="bg-transparent border-none text-sm text-gray-900 focus:ring-0 hover:bg-gray-100 rounded px-2 py-1 -ml-2 w-48 placeholder-gray-400"
                            value={task.category || ''}
                            onChange={(e) => setTask({ ...task, category: e.target.value })}
                            onBlur={(e) => handleSaveField('category', e.target.value)}
                        />
                    </div>
                </div>

                {/* Description (Editor) */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="prose max-w-none">
                        <Editor data={editorData} onChange={handleDescriptionSave} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetail;
