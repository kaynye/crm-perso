import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, FileText, Plus } from 'lucide-react';
import api from '../api/axios';
import clsx from 'clsx';

interface PageNode {
    id: string;
    title: string;
    page_type: string;
    children: PageNode[];
}

const SidebarItem: React.FC<{ node: PageNode; level?: number }> = ({ node, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = node.children && node.children.length > 0;
    const navigate = useNavigate();

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div>
            <div
                className={clsx(
                    "flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer group",
                    level > 0 && "ml-4"
                )}
                onClick={() => navigate(`/pages/${node.id}`)}
            >
                <button
                    onClick={handleToggle}
                    className={clsx(
                        "p-0.5 rounded hover:bg-gray-200 mr-1",
                        !hasChildren && "invisible"
                    )}
                >
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <FileText size={14} className="mr-2 text-gray-500" />
                <span className="truncate">{node.title}</span>
            </div>
            {isOpen && hasChildren && (
                <div>
                    {node.children.map((child) => (
                        <SidebarItem key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const Sidebar: React.FC = () => {
    const [pages, setPages] = useState<PageNode[]>([]);
    const navigate = useNavigate();

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

    const createPage = async () => {
        try {
            const response = await api.post('/pages/', { title: 'Untitled', content: '{}' });
            fetchPages();
            navigate(`/pages/${response.data.id}`);
        } catch (error) {
            console.error("Failed to create page", error);
        }
    };

    return (
        <div className="w-64 h-screen bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <span className="font-semibold text-gray-700">Workspace</span>
            </div>
            <div className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">CRM</div>
                <div className="space-y-1">
                    <div onClick={() => navigate('/crm/companies')} className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded">
                        <span className="truncate">Companies</span>
                    </div>
                    <div onClick={() => navigate('/crm/contacts')} className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded">
                        <span className="truncate">Contacts</span>
                    </div>
                </div>
                <div className="mt-4 px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tasks</div>
                <div className="space-y-1">
                    <div onClick={() => navigate('/tasks')} className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded">
                        <span className="truncate">Board</span>
                    </div>
                </div>
            </div>
            <div className="px-4 pt-4 pb-2 border-t border-gray-200 flex justify-between items-center">
                <span className="font-semibold text-gray-700">Pages</span>
                <button onClick={createPage} className="p-1 hover:bg-gray-200 rounded">
                    <Plus size={16} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
                {pages.map((page) => (
                    <SidebarItem key={page.id} node={page} />
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
