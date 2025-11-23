import React, { useState, useEffect, useRef } from 'react';
import { X, Search, FileText, Building, User, CheckSquare } from 'lucide-react';
import api from '../api/axios';
import clsx from 'clsx';

interface MentionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: any) => void;
}

const MentionModal: React.FC<MentionModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        const search = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const response = await api.get(`/search/mentions/?q=${query}`);
                setResults(response.data);
                setSelectedIndex(0);
            } catch (error) {
                console.error("Failed to search mentions", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(search, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results[selectedIndex]) {
                onSelect(results[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'page': return <FileText size={14} className="text-gray-400" />;
            case 'company': return <Building size={14} className="text-blue-400" />;
            case 'contact': return <User size={14} className="text-green-400" />;
            case 'task': return <CheckSquare size={14} className="text-red-400" />;
            default: return <FileText size={14} className="text-gray-400" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20">
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <Search size={18} className="text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search pages, people, tasks..."
                        className="flex-1 outline-none text-gray-900 placeholder-gray-400 text-sm"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>
                    ) : results.length > 0 ? (
                        <div className="py-2">
                            {results.map((item, index) => (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    className={clsx(
                                        "px-4 py-2 flex items-center gap-3 cursor-pointer text-sm",
                                        index === selectedIndex ? "bg-indigo-50 text-indigo-900" : "text-gray-700 hover:bg-gray-50"
                                    )}
                                    onClick={() => onSelect(item)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    {getIcon(item.type)}
                                    <div className="flex-1">
                                        <div className="font-medium">{item.label}</div>
                                        <div className="text-xs text-gray-400 capitalize">{item.type}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : query ? (
                        <div className="p-4 text-center text-gray-400 text-sm">No results found</div>
                    ) : (
                        <div className="p-4 text-center text-gray-400 text-xs">Type to search...</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MentionModal;
