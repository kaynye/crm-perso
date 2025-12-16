import React from 'react';
import { MessageSquareText } from 'lucide-react';
import ChatInterface from './ChatInterface';
import { useChat } from '../../context/ChatContext';

const ChatWidget: React.FC = () => {
    const { isOpen, setIsOpen } = useChat();

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-[100] sm:z-50 sm:bottom-24 sm:right-6 sm:left-auto sm:top-auto flex flex-col items-end justify-end sm:block">
                    {/* Backdrop for mobile */}
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm sm:hidden"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Chat Window Container */}
                    <div className="relative w-full h-[100dvh] sm:w-auto sm:h-auto animate-in slide-in-from-bottom-10 fade-in duration-300">
                        <ChatInterface onClose={() => setIsOpen(false)} />
                    </div>
                </div>
            )}

            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`p-4 rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${isOpen
                        ? 'bg-white text-gray-600 rotate-90 ring-2 ring-gray-100'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/30'
                        }`}
                    title={isOpen ? "Fermer" : "Ouvrir l'assistant"}
                >
                    <MessageSquareText size={24} />
                </button>
            </div>
        </>
    );
};

export default ChatWidget;
