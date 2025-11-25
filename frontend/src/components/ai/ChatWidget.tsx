import React, { useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import ChatInterface from './ChatInterface';

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {isOpen && (
                <div className="animate-in slide-in-from-bottom-5 fade-in duration-200 origin-bottom-right">
                    <ChatInterface onClose={() => setIsOpen(false)} />
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-lg transition-all duration-200 ${isOpen
                        ? 'bg-gray-200 text-gray-600 rotate-90'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'
                    }`}
                title="Assistant IA"
            >
                <MessageSquareText size={24} />
            </button>
        </div>
    );
};

export default ChatWidget;
