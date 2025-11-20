import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Plus } from 'lucide-react';

const TaskBoard: React.FC = () => {
    const [tasks, setTasks] = useState<any>({ todo: [], in_progress: [], done: [] });

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await api.get('/tasks/kanban/');
            setTasks(response.data);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        }
    };

    const createTask = async () => {
        const title = prompt("Task Title:");
        if (title) {
            try {
                await api.post('/tasks/', { title, status: 'todo' });
                fetchTasks();
            } catch (error) {
                console.error("Failed to create task", error);
            }
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

    const Column = ({ title, status, items }: { title: string, status: string, items: any[] }) => (
        <div
            className="bg-gray-100 p-4 rounded-lg w-1/3 mx-2"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, status)}
        >
            <h3 className="font-bold mb-4 text-gray-700 uppercase text-sm">{title} ({items.length})</h3>
            <div className="space-y-3">
                {items.map((task) => (
                    <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, task.id)}
                        className="bg-white p-3 rounded shadow cursor-move hover:shadow-md transition-shadow"
                    >
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {task.assigned_to_name && (
                            <p className="text-xs text-gray-500 mt-1">Assigned to: {task.assigned_to_name}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
                <button onClick={createTask} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    <Plus size={16} className="mr-2" />
                    New Task
                </button>
            </div>
            <div className="flex flex-1 overflow-x-auto pb-4">
                <Column title="To Do" status="todo" items={tasks.todo || []} />
                <Column title="In Progress" status="in_progress" items={tasks.in_progress || []} />
                <Column title="Done" status="done" items={tasks.done || []} />
            </div>
        </div>
    );
};

export default TaskBoard;
