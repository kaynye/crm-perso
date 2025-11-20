import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';

const Layout: React.FC = () => {
    return (
        <div className="flex h-screen bg-white">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <CommandPalette />
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
