import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, X, ExternalLink } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    action?: {
        type: string;
        label: string;
        url: string;
    };
}

interface ChatInterfaceProps {
    onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider avec vos données CRM ou vos tâches ?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Send the entire history (excluding the initial greeting if it was system generated, but here it's assistant)
            // Actually, let's send the history.
            const apiMessages = [...messages, userMessage].filter(m => m.role !== 'system'); // Filter out system if any (frontend doesn't usually have system)

            const response = await api.post('/ai/chat/', {
                messages: apiMessages,
                context: {
                    path: location.pathname
                }
            });

            const assistantMessage: Message = {
                role: 'assistant',
                content: response.data.content,
                action: response.data.action
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Failed to send message", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, une erreur est survenue. Veuillez réessayer." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-80 sm:w-96">
            {/* Header */}
            <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <Bot size={20} />
                    <h3 className="font-semibold">Assistant IA</h3>
                </div>
                <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded">
                    <X size={18} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                            }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            {msg.action && msg.action.type === 'NAVIGATE' && (
                                <button
                                    onClick={() => {
                                        const currentPath = location.pathname.replace(/\/$/, '');
                                        const targetPath = msg.action!.url.replace(/\/$/, '');

                                        if (currentPath === targetPath) {
                                            window.location.reload();
                                        } else {
                                            navigate(msg.action!.url);
                                        }
                                        onClose();
                                    }}
                                    className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium hover:bg-indigo-100 transition-colors"
                                >
                                    <ExternalLink size={12} />
                                    {msg.action.label}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm rounded-bl-none">
                            <Loader2 size={16} className="animate-spin text-indigo-600" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Posez une question..."
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
