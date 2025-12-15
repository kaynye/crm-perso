import React from 'react';

interface GuestLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

const GuestLayout: React.FC<GuestLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-indigo-500 selection:text-white">
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-200">
                            P
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 leading-none">{title || 'Guest Portal'}</h1>
                            {subtitle && <p className="text-xs text-gray-500 mt-0.5 font-medium">{subtitle}</p>}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            Read-Only Access
                        </span>
                    </div>
                </div>
            </header>
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
                {children}
            </main>
            <footer className="py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-xs font-medium text-gray-400">
                    Powered by Kaynye CRM
                </div>
            </footer>
        </div>
    );
};

export default GuestLayout;
