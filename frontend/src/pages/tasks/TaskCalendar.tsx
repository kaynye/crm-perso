import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TaskCalendarProps {
    tasks: any[];
    onTaskClick: (taskId: string) => void;
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks, onTaskClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        // Adjust for Monday start
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
        return { days, firstDay: adjustedFirstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getTasksForDay = (day: number) => {
        return tasks.filter(task => {
            if (!task.due_date) return false;
            const taskDate = new Date(task.due_date);
            return (
                taskDate.getDate() === day &&
                taskDate.getMonth() === currentDate.getMonth() &&
                taskDate.getFullYear() === currentDate.getFullYear()
            );
        });
    };

    const handleDayClick = (day: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(newDate);
    };

    const renderCalendarDays = () => {
        const calendarDays = [];
        // Empty cells for previous month
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="h-14 md:h-32 bg-gray-50/50 border-b border-r border-gray-100"></div>);
        }

        // Days of the month
        for (let day = 1; day <= days; day++) {
            const dayTasks = getTasksForDay(day);
            const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

            const isSelected =
                day === selectedDate.getDate() &&
                currentDate.getMonth() === selectedDate.getMonth() &&
                currentDate.getFullYear() === selectedDate.getFullYear();

            calendarDays.push(
                <div
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`h-14 md:h-32 border-b border-r border-gray-100 p-1 md:p-2 transition-colors hover:bg-gray-50 cursor-pointer md:cursor-default relative
                        ${isToday ? 'bg-indigo-50/30' : ''}
                        ${isSelected ? 'ring-2 ring-inset ring-indigo-500 md:ring-0' : ''}
                    `}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs md:text-sm font-medium w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}>
                            {day}
                        </span>
                    </div>

                    {/* Desktop View: List of tasks */}
                    <div className="hidden md:block space-y-1 overflow-y-auto max-h-[calc(100%-1.5rem)] custom-scrollbar">
                        {dayTasks.map(task => (
                            <div
                                key={task.id}
                                onClick={(e) => { e.stopPropagation(); onTaskClick(task.id); }}
                                className={`text-xs p-1.5 rounded border cursor-pointer truncate transition-shadow hover:shadow-sm ${task.status === 'done' ? 'bg-gray-100 text-gray-500 border-gray-200 line-through' :
                                    task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-100' :
                                        task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                            'bg-blue-50 text-blue-700 border-blue-100'
                                    }`}
                                title={task.title}
                            >
                                {task.title}
                            </div>
                        ))}
                    </div>

                    {/* Mobile View: Dots */}
                    <div className="md:hidden flex gap-1 flex-wrap content-end h-full pb-1 pl-1">
                        {dayTasks.slice(0, 4).map(task => (
                            <div
                                key={task.id}
                                className={`w-1.5 h-1.5 rounded-full ${task.status === 'done' ? 'bg-gray-400' :
                                        task.priority === 'high' ? 'bg-red-500' :
                                            task.priority === 'medium' ? 'bg-yellow-500' :
                                                'bg-blue-500'
                                    }`}
                            />
                        ))}
                        {dayTasks.length > 4 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        )}
                    </div>
                </div>
            );
        }
        return calendarDays;
    };

    // Get tasks for the selected date (Mobile view)
    const selectedDayTasks = tasks.filter(task => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        return (
            taskDate.getDate() === selectedDate.getDate() &&
            taskDate.getMonth() === selectedDate.getMonth() &&
            taskDate.getFullYear() === selectedDate.getFullYear()
        );
    });

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
                <div className="p-4 flex justify-between items-center border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 capitalize">
                        {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex space-x-2">
                        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => {
                            const now = new Date();
                            setCurrentDate(now);
                            setSelectedDate(now);
                        }} className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200">
                            Aujourd'hui
                        </button>
                        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {day.slice(0, 1)}<span className="hidden md:inline">{day.slice(1)}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 flex-1 overflow-y-auto">
                    {renderCalendarDays()}
                </div>
            </div>

            {/* Mobile Task List */}
            <div className="md:hidden bg-white rounded-xl shadow-sm border border-gray-200 p-4 min-h-[200px]">
                <h3 className="font-medium text-gray-900 mb-3">
                    {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <div className="space-y-2">
                    {selectedDayTasks.length > 0 ? (
                        selectedDayTasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => onTaskClick(task.id)}
                                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${task.status === 'done' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-indigo-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-gray-400' :
                                            task.priority === 'high' ? 'bg-red-500' :
                                                task.priority === 'medium' ? 'bg-yellow-500' :
                                                    'bg-blue-500'
                                        }`} />
                                    <span className={`text-sm font-medium ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                        {task.title}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500 capitalize">{task.status === 'in_progress' ? 'En cours' : task.status === 'todo' ? 'À faire' : 'Terminé'}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">Aucune tâche pour ce jour.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskCalendar;
