import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';

interface ActionsMenuProps {
    onEdit?: () => void;
    onDelete?: () => void;
    customActions?: { label: string; onClick: () => void; icon?: React.ReactNode }[];
}

const ActionsMenu: React.FC<ActionsMenuProps> = ({ onEdit, onDelete, customActions = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
                <MoreHorizontal size={16} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-50 py-1">
                    {onEdit && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); onEdit(); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                            <Edit size={14} className="mr-2" /> Edit
                        </button>
                    )}
                    {customActions.map((action, index) => (
                        <button
                            key={index}
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); action.onClick(); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                            {action.icon && <span className="mr-2">{action.icon}</span>}
                            {action.label}
                        </button>
                    ))}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                if (window.confirm('Are you sure you want to delete this item?')) {
                                    onDelete();
                                }
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                            <Trash2 size={14} className="mr-2" /> Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ActionsMenu;
