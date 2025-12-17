import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X, ExternalLink, Mic, Square, Paperclip, Bot, User, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { useChat, type Message } from '../../context/ChatContext';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github-dark.css';

interface ChatInterfaceProps {
    onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Use Context
    const {
        messages,
        setMessages,
        isLoading,
        setIsLoading,
        currentInput: input,
        setCurrentInput: setInput,
        pageContext,
        resetChat,
        conversationId,
        setConversationId
    } = useChat();

    // SMART SUGGESTIONS (Chips)
    const getSuggestions = () => {
        if (messages.length > 1) return []; // Hide if chat started

        if (pageContext?.source === 'GuestMeetings') {
            return [
                { label: '📝 Résumer ces réunions', value: 'Fais-moi un résumé concis de ces réunions.' },
                { label: '✅ Extraire les tâches', value: 'Y a-t-il des tâches à faire suite à ces réunions ?' },
                { label: '📅 Prochaine dispo', value: 'Quand est ma prochaine réunion ?' }
            ];
        }

        // Default suggestions
        return [
            { label: '📅 Mes tâches du jour', value: 'Quelles sont mes tâches pour aujourd\'hui ?' },
            { label: '📊 Résumé des contrats', value: 'Donne-moi un résumé des contrats récents.' },
            { label: '📝 Extraire des tâches', value: 'J\'ai des notes de réunion, peux-tu en extraire les tâches ?' },
            { label: '📧 Rédiger un email', value: 'Aide-moi à rédiger un email client.' }
        ];
    };

    const suggestions = getSuggestions();

    // TTS State
    const [isMuted, setIsMuted] = useState(() => {
        return localStorage.getItem('chat_muted') === 'true';
    });

    const speak = (text: string) => {
        if (isMuted) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 1.1; // Slightly faster
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        localStorage.setItem('chat_muted', String(isMuted));
        if (isMuted) {
            window.speechSynthesis.cancel();
        }
    }, [isMuted]);

    // Auto-speak new assistant messages
    useEffect(() => {
        if (!isLoading && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'assistant' && !isMuted) {
                // Remove markdown symbols for cleaner speech
                const cleanText = lastMsg.content.replace(/[*#_`]/g, '');
                speak(cleanText);
            }
        }
    }, [messages, isLoading, isMuted]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const [isListening, setIsListening] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'fr-FR';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setSpeechError(null);
            };

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    finalTranscript += event.results[i][0].transcript;
                }
                setInput(finalTranscript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setSpeechError(event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.start();
        } else {
            alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/ai/upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const fileId = res.data.file_id;

            const userMessage: Message = { role: 'user', content: `[Fichier envoyé: ${file.name}]` };
            setMessages(prev => [...prev, userMessage]);
            setMessages(prev => [...prev, { role: 'assistant', content: "J'ai reçu votre fichier. Que souhaitez-vous savoir ?" }]);
            setInput(`Analyse ce fichier (ID: ${fileId})`);

        } catch (error) {
            console.error("Upload error", error);
            alert("Erreur lors de l'envoi du fichier.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            scrollToBottom();
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = '48px';
        }

        setIsLoading(true);
        scrollToBottom();

        try {
            const apiMessages = [...messages, userMessage].filter(m => m.role !== 'system');

            const token = localStorage.getItem('access_token');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

            const response = await fetch(`${baseUrl}/ai/chat/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    messages: apiMessages,
                    conversation_id: conversationId, // Send ID
                    context: {
                        path: location.pathname,
                        data: pageContext
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Capture Conversation ID from header if new
            const newConvId = response.headers.get('X-Conversation-ID');
            if (newConvId && !conversationId) {
                setConversationId(newConvId);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                // Handle JSON Response (Tool Actions)
                const data = await response.json();

                // Also check body for conversation_id if not in header
                if (data.conversation_id && !conversationId) {
                    setConversationId(data.conversation_id);
                }

                const assistantMessage: Message = {
                    role: 'assistant',
                    content: data.content,
                    action: data.action
                };
                setMessages(prev => [...prev, assistantMessage]);

            } else {
                // Handle Streaming Response (Chat)
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                if (!reader) throw new Error("No readable stream");

                // Initialize empty assistant message
                setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

                let fullContent = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    fullContent += chunk;

                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMsg = newMessages[newMessages.length - 1];
                        if (lastMsg.role === 'assistant') {
                            lastMsg.content = fullContent;
                        }
                        return newMessages;
                    });
                }
            }

        } catch (error) {
            console.error("Failed to send message", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, une erreur est survenue. Veuillez réessayer." }]);
        } finally {
            setIsLoading(false);
            scrollToBottom();
        }
    };

    return (
        <div className="flex flex-col h-full w-full sm:h-[600px] sm:w-[450px] bg-white/95 backdrop-blur-md sm:rounded-2xl shadow-2xl border-0 sm:border border-gray-100 overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 pt- safe-top flex justify-between items-center text-white shadow-md shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight">Assistant IA</h3>
                        <div className="flex items-center gap-1.5 opacity-90">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-xs font-medium">En ligne</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (confirm('Voulez-vous vraiment effacer la conversation ?')) {
                                resetChat();
                            }
                        }}
                        className="hover:bg-white/20 p-2 rounded-full transition-colors duration-200"
                        title="Nouvelle conversation"
                    >
                        <Trash2 size={20} />
                    </button>
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="hover:bg-white/20 p-2 rounded-full transition-colors duration-200"
                        title={isMuted ? "Activer la voix" : "Couper la voix"}
                    >
                        {isMuted ? <Bot size={20} className="opacity-50" /> : <Bot size={20} />}
                    </button>
                    <button
                        onClick={onClose}
                        className="hover:bg-white/20 p-2 rounded-full transition-colors duration-200"
                        aria-label="Fermer"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {speechError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm text-center shadow-sm">
                        Problème avec le micro : {speechError}
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div key={index} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>

                            {/* AI Avatar */}
                            {!isUser && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border border-indigo-50 shadow-sm mb-1 flex-shrink-0">
                                    <Sparkles size={14} className="text-indigo-600" />
                                </div>
                            )}

                            <div className={`flex flex-col max-w-[85%] sm:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed transition-all duration-200
                                        ${isUser
                                            ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-200'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-gray-200'
                                        }`}
                                >
                                    {isUser ? (
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    ) : (
                                        <div className="prose prose-sm max-w-none prose-indigo prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5">
                                            <ReactMarkdown
                                                rehypePlugins={[rehypeHighlight]}
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    table: ({ node, ...props }) => <table className="border-collapse table-auto w-full text-sm my-4" {...props} />,
                                                    th: ({ node, ...props }) => <th className="border border-gray-200 px-3 py-2 bg-gray-50 text-left font-semibold" {...props} />,
                                                    td: ({ node, ...props }) => <td className="border border-gray-200 px-3 py-2" {...props} />,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>

                                {/* Actions / Actions */}
                                {msg.action && (
                                    <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300 w-full">
                                        {msg.action.type === 'NAVIGATE' && msg.action.url && (
                                            <button
                                                onClick={() => {
                                                    const currentPath = location.pathname.replace(/\/$/, '');
                                                    const targetPath = msg.action!.url!.replace(/\/$/, '');
                                                    if (currentPath === targetPath) {
                                                        window.location.reload();
                                                    } else {
                                                        navigate(msg.action!.url!);
                                                    }
                                                    onClose();
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 rounded-xl border border-indigo-100 text-xs font-semibold hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm"
                                            >
                                                <ExternalLink size={14} />
                                                <span>{msg.action.label}</span>
                                            </button>
                                        )}
                                        {msg.action.type === 'CHOICES' && (
                                            <div className="flex flex-wrap gap-2">
                                                {((index === 0 ? suggestions : msg.action?.choices) || []).map((choice, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            setInput(choice.value);
                                                            handleSend();
                                                        }}
                                                        className="px-3 py-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-xs font-semibold hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm transform active:scale-95"
                                                    >
                                                        {choice.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* User Avatar */}
                            {isUser && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border border-gray-100 shadow-sm mb-1 flex-shrink-0 overflow-hidden">
                                    <User size={16} className="text-gray-500" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Loading Indicator (Only show if still buffering or initial connect) */}
                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border border-indigo-50 shadow-sm mb-1 flex-shrink-0">
                            <Sparkles size={14} className="text-indigo-600" />
                        </div>
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 safe-bottom">
                <div className="flex gap-2 items-end bg-gray-50 p-1.5 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">

                    {/* Attachment Button */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*,.pdf"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isLoading}
                        className="p-2 mb-0.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-colors shrink-0"
                        title="Envoyer un fichier"
                    >
                        {isUploading ? <Loader2 size={24} className="animate-spin" /> : <Paperclip size={24} />}
                    </button>

                    {/* Mic Button */}
                    <button
                        onClick={toggleListening}
                        className={`p-2 mb-0.5 rounded-xl transition-all duration-300 shrink-0 ${isListening
                            ? 'bg-red-50 text-red-500 animate-pulse ring-1 ring-red-200'
                            : 'text-gray-400 hover:text-indigo-600 hover:bg-white'}`}
                        title={isListening ? "Arrêter" : "Dicter"}
                    >
                        {isListening ? <Square size={24} className="fill-current" /> : <Mic size={24} />}
                    </button>

                    {/* Text Area */}
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            // Auto-resize
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Message..."
                        className="flex-1 bg-transparent border-none text-gray-700 text-base py-3 focus:ring-0 placeholder-gray-400 px-2 min-w-0 resize-none max-h-[120px]"
                        disabled={isLoading}
                        rows={1}
                        style={{ height: '48px' }} // Initial height
                    />

                    {/* Send Button */}
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className={`p-3 mb-0.5 rounded-xl transition-all duration-200 transform shrink-0
                            ${(isLoading || !input.trim())
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105 active:scale-95'
                            }`}
                    >
                        <Send size={20} className={isLoading ? 'opacity-0' : ''} />
                    </button>
                </div>
                <div className="text-[10px] text-center text-gray-400 mt-2 font-medium">
                    •IA de Kaynye dev Confidentiel & Sécurisé
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
