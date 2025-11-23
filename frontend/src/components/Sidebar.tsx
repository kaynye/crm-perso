import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown, FileText, Plus, Database as DatabaseIcon } from 'lucide-react';
import api from '../api/axios';
import clsx from 'clsx';
import ActionsMenu from './ActionsMenu';

interface PageNode {
    id: string;
    title: string;
    page_type: string;
    children: PageNode[];
    database_id?: string;
}

interface SidebarItemProps {
    node: PageNode;
    level?: number;
    onRefresh: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ node, level = 0, onRefresh }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const hasChildren = node.children && node.children.length > 0;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleClick = () => {
        if (node.page_type === 'database' && node.database_id) {
            navigate(`/databases/${node.database_id}`);
        } else {
            navigate(`/pages/${node.id}`);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this page?')) {
            try {
                await api.delete(`/pages/${node.id}/`);
                onRefresh();
            } catch (error) {
                console.error("Failed to delete page", error);
            }
        }
    };

    const handleRename = async () => {
        const newTitle = prompt("Enter new page title:", node.title);
        if (newTitle && newTitle !== node.title) {
            try {
                await api.patch(`/pages/${node.id}/`, { title: newTitle });
                onRefresh();
            } catch (error) {
                console.error("Failed to rename page", error);
            }
        }
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', node.id);
        e.stopPropagation();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const draggedId = e.dataTransfer.getData('text/plain');

        if (draggedId === node.id) return; // Cannot drop on itself

        try {
            await api.patch(`/pages/${draggedId}/`, { parent: node.id });
            onRefresh();
            setIsOpen(true); // Open the target folder
        } catch (error) {
            console.error("Failed to move page", error);
        }
    };

    const isActive = location.pathname === `/pages/${node.id}` || (node.database_id && location.pathname === `/databases/${node.database_id}`);

    return (
        <div>
            <div
                draggable
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={clsx(
                    "group flex items-center px-2 py-1.5 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white cursor-pointer rounded-md transition-colors mb-0.5",
                    isActive && "bg-zinc-800 font-medium text-white",
                    isDragOver && "bg-zinc-700 ring-2 ring-indigo-500"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleClick}
            >
                <span onClick={handleToggle} className="mr-1 p-0.5 hover:bg-zinc-700 rounded cursor-pointer text-gray-500 hover:text-white">
                    {hasChildren ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-4 inline-block" />}
                </span>
                {node.page_type === 'database' ? <DatabaseIcon size={14} className="mr-2 text-blue-400" /> : <FileText size={14} className="mr-2 text-gray-500 group-hover:text-white transition-colors" />}
                <span className="truncate flex-1">{node.title}</span>

                <div className="opacity-0 group-hover:opacity-100">
                    <ActionsMenu onEdit={handleRename} onDelete={handleDelete} />
                </div>
            </div>
            {isOpen && hasChildren && (
                <div>
                    {node.children.map(child => (
                        <SidebarItem key={child.id} node={child} level={level + 1} onRefresh={onRefresh} />
                    ))}
                </div>
            )}
        </div>
    );
};

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const [pages, setPages] = useState<PageNode[]>([]);
    const navigate = useNavigate();
    const location = useLocation();
    const [isDragOver, setIsDragOver] = useState(false);

    const fetchPages = async () => {
        try {
            const response = await api.get('/pages/tree/');
            setPages(response.data);
        } catch (error) {
            console.error("Failed to fetch pages", error);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        onClose();
    }, [location.pathname, onClose]);

    const createPage = async () => {
        try {
            const response = await api.post('/pages/', { title: 'Untitled', content: '{}' });
            fetchPages();
            navigate(`/pages/${response.data.id}`);
        } catch (error) {
            console.error("Failed to create page", error);
        }
    };

    const createDatabase = async () => {
        try {
            // 1. Create Page
            const pageResponse = await api.post('/pages/', { title: 'New Database', page_type: 'database', content: '{}' });
            const pageId = pageResponse.data.id;

            // 2. Create Database linked to Page
            const dbResponse = await api.post('/databases/', { title: 'New Database', page: pageId });

            fetchPages();
            navigate(`/databases/${dbResponse.data.id}`);
        } catch (error) {
            console.error("Failed to create database", error);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const draggedId = e.dataTransfer.getData('text/plain');

        if (!draggedId) return;

        try {
            // Setting parent to null moves it to root
            await api.patch(`/pages/${draggedId}/`, { parent: null });
            fetchPages();
        } catch (error) {
            console.error("Failed to move page to root", error);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            <div className={clsx(
                "h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col text-gray-300 transition-all duration-300 z-[100]",
                "fixed inset-y-0 left-0 w-64 transform md:relative md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                    <span className="font-bold text-white tracking-tight text-lg">Nexus</span>
                </div>
                <div className="p-2 space-y-6">
                    <div>
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">CRM</div>
                        <div className="space-y-0.5">
                            <div onClick={() => navigate('/crm/companies')} className="flex items-center px-2 py-1.5 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white cursor-pointer rounded-md transition-colors">
                                <span className="truncate">Companies</span>
                            </div>
                            <div onClick={() => navigate('/crm/contacts')} className="flex items-center px-2 py-1.5 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white cursor-pointer rounded-md transition-colors">
                                <span className="truncate">Contacts</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tasks</div>
                        <div className="space-y-0.5">
                            <div onClick={() => navigate('/tasks')} className="flex items-center px-2 py-1.5 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white cursor-pointer rounded-md transition-colors">
                                <span className="truncate">Board</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    className={clsx(
                        "px-4 pt-4 pb-2 border-t border-zinc-800 flex justify-between items-center mt-auto transition-colors",
                        isDragOver && "bg-zinc-800/50 ring-2 ring-indigo-500/50"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <span className="font-semibold text-gray-300 text-sm">Pages {isDragOver && "(Drop to Un-nest)"}</span>
                    <div className="flex space-x-1">
                        <button onClick={createPage} className="p-1 hover:bg-zinc-800 rounded text-gray-500 hover:text-white transition-colors" title="New Page">
                            <Plus size={16} />
                        </button>
                        <button onClick={createDatabase} className="p-1 hover:bg-zinc-800 rounded text-gray-500 hover:text-white transition-colors" title="New Database">
                            <DatabaseIcon size={16} />
                        </button>
                    </div>
                </div>
                <div
                    className={clsx(
                        "flex-1 overflow-y-auto py-2 sidebar-scroll transition-colors",
                        isDragOver && "bg-zinc-800/50"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {pages.map((page) => (
                        <SidebarItem key={page.id} node={page} onRefresh={fetchPages} />
                    ))}
                    {pages.length === 0 && (
                        <div className="px-4 py-8 text-center text-sm text-gray-500 border-2 border-dashed border-zinc-800 rounded-lg m-2">
                            No pages yet. Create one or drag here.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
