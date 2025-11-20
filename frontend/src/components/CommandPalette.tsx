import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../api/axios';

const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const search = async () => {
            if (query.trim().length === 0) {
                setResults([]);
                return;
            }
            try {
                const response = await api.get(`/search/global/?q=${query}`);
                setResults(response.data);
                setSelectedIndex(0);
            } catch (error) {
                console.error("Search failed", error);
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
                navigate(results[selectedIndex].url);
                setIsOpen(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                <div className="flex items-center px-4 py-3 border-b border-gray-100">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search pages, tasks, people..."
                        className="flex-1 bg-transparent border-none outline-none text-lg text-gray-800 placeholder-gray-400"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="text-xs text-gray-400 font-medium px-2 py-1 bg-gray-100 rounded">ESC</div>
                </div>
                {results.length > 0 && (
                    <div className="max-h-[60vh] overflow-y-auto py-2">
                        {results.map((result, index) => (
                            <div
                                key={result.id}
                                className={`px-4 py-3 flex items-center cursor-pointer ${index === selectedIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                                onClick={() => {
                                    navigate(result.url);
                                    setIsOpen(false);
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">{result.title}</div>
                                    <div className="text-xs text-gray-500">{result.subtitle}</div>
                                </div>
                                <div className="text-xs text-gray-400 uppercase tracking-wider">{result.type}</div>
                            </div>
                        ))}
                    </div>
                )}
                {query && results.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-500">
                        No results found for "{query}"
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommandPalette;
