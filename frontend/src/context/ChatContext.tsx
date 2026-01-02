import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    action?: {
        type: string;
        label: string;
        url?: string;
        choices?: { label: string; value: string }[];
    };
    sources?: Array<{
        id: string;
        title: string;
        type: string;
    }>;
}

interface ChatContextType {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    currentInput: string;
    setCurrentInput: (text: string) => void;
    pageContext: any;
    setPageContext: (data: any) => void;
    conversationId: string | null;
    setConversationId: React.Dispatch<React.SetStateAction<string | null>>;
    resetChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const INITIAL_MESSAGE: Message = {
    role: 'assistant',
    content: 'Bonjour ! Je suis votre assistant personnel. Que puis-je faire pour vous aujourd\'hui ?',
    action: {
        type: 'CHOICES',
        label: 'Suggestions',
        choices: [
            { label: '📅 Mes tâches du jour', value: 'Quelles sont mes tâches pour aujourd\'hui ?' },
            { label: '📊 Résumé des contrats', value: 'Donne-moi un résumé des contrats récents.' },
            { label: '📝 Extraire des tâches', value: 'J\'ai des notes de réunion, peux-tu en extraire les tâches ?' },
            { label: '📧 Rédiger un email', value: 'Aide-moi à rédiger un email client.' }
        ]
    }
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize from localStorage if available
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem('chat_history');
        return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
    });

    const [isOpen, setIsOpen] = useState(() => {
        // Optional: Persist open state? Maybe annoying if it opens on every reload.
        // Let's NOT persist open state, but if user navigates it stays open?
        // Actually, for "change de page" (route change), simply being in Context keeps it open!
        // So we default to false (closed) on fresh load, but navigating routes won't reset it.
        return false;
    });

    const [isLoading, setIsLoading] = useState(false);
    const [currentInput, setCurrentInput] = useState(() => {
        return localStorage.getItem('chat_input') || '';
    });

    // Persist messages to localStorage
    useEffect(() => {
        localStorage.setItem('chat_history', JSON.stringify(messages));
    }, [messages]);

    // Persist input draft
    useEffect(() => {
        localStorage.setItem('chat_input', currentInput);
    }, [currentInput]);

    const [conversationId, setConversationId] = useState<string | null>(() => {
        return localStorage.getItem('chat_conversation_id');
    });

    const [pageContext, setPageContext] = useState<any>(null);

    // Persist conversationId
    useEffect(() => {
        if (conversationId) {
            localStorage.setItem('chat_conversation_id', conversationId);
        } else {
            localStorage.removeItem('chat_conversation_id');
        }
    }, [conversationId]);

    const resetChat = () => {
        setMessages([INITIAL_MESSAGE]);
        setConversationId(null);
        localStorage.removeItem('chat_conversation_id');
        localStorage.removeItem('chat_history');
    };

    return (
        <ChatContext.Provider value={{
            messages,
            setMessages,
            isOpen,
            setIsOpen,
            isLoading,
            setIsLoading,
            currentInput,
            setCurrentInput,
            pageContext,
            setPageContext,
            conversationId,
            setConversationId,
            resetChat
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
