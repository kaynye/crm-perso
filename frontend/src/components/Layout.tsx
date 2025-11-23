import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import { Menu } from 'lucide-react';

const Layout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleCloseSidebar = useCallback(() => {
        setIsSidebarOpen(false);
    }, []);

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
            <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-white">
                {/* Mobile Header */}
                <div className="md:hidden p-4 border-b border-gray-100 flex items-center bg-white z-10">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-lg ml-2 text-gray-900">Nexus</span>
                </div>

                <div className="flex-1 overflow-auto">
                    <CommandPalette />
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
