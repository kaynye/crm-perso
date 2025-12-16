import React, { useState } from 'react';

const GuestTaskCalendar: React.FC<{ tasks: any[], onTaskClick: (task: any) => void }> = ({ tasks, onTaskClick }) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const getTasksForDate = (day: number) => {
        return tasks.filter(t => {
            if (!t.due_date) return false;
            const d = new Date(t.due_date);
            return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">{monthNames[currentMonth]} {currentYear}</h3>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-1 px-3 border rounded hover:bg-gray-50 text-sm">Préc</button>
                    <button onClick={nextMonth} className="p-1 px-3 border rounded hover:bg-gray-50 text-sm">Suiv</button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(d => (
                    <div key={d} className="bg-gray-50 text-center py-2 text-xs font-semibold text-gray-500 uppercase">{d}</div>
                ))}
                {/* Empty slots for start of month */}
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-white h-32"></div>
                ))}
                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayTasks = getTasksForDate(day);
                    return (
                        <div key={day} className="bg-white h-32 p-2 border-t border-gray-100 relative group hover:bg-gray-50 transition-colors">
                            <span className={`text-sm font-medium ${dayTasks.length > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>{day}</span>
                            <div className="mt-1 space-y-1 overflow-y-auto max-h-[90px] scrollbar-hide">
                                {dayTasks.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => onTaskClick(t)}
                                        className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate ${t.status === 'done' ? 'bg-green-100 text-green-700 line-through opacity-70' :
                                            'bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100'
                                            }`}
                                    >
                                        {t.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GuestTaskCalendar;
