import React, { useState } from 'react';
import api from '../../api/axios';
import { Sparkles, RefreshCw } from 'lucide-react';

interface AISummaryProps {
    textToSummarize: string;
    onSummaryGenerated?: (summary: string) => void;
}

const AISummary: React.FC<AISummaryProps> = ({ textToSummarize, onSummaryGenerated }) => {
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateSummary = async () => {
        if (!textToSummarize) return;

        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/ai/summarize/', { text: textToSummarize });
            const generatedSummary = response.data.summary;
            setSummary(generatedSummary);
            if (onSummaryGenerated) {
                onSummaryGenerated(generatedSummary);
            }
        } catch (err) {
            console.error("Summary generation failed", err);
            setError("Impossible de générer le résumé. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    if (!textToSummarize) return null;

    return (
        <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4 mt-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-600" />
                    Résumé IA
                </h4>
                {!summary && !loading && (
                    <button
                        onClick={generateSummary}
                        className="text-xs bg-white border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-50 transition-colors"
                    >
                        Générer le résumé
                    </button>
                )}
                {summary && (
                    <button
                        onClick={generateSummary}
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Régénérer"
                    >
                        <RefreshCw size={14} />
                    </button>
                )}
            </div>

            {loading && (
                <div className="flex items-center gap-2 text-sm text-indigo-600 animate-pulse">
                    <Sparkles size={14} />
                    Génération du résumé en cours...
                </div>
            )}

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {summary && !loading && (
                <div className="prose prose-sm prose-indigo max-w-none text-gray-700 bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                    <p className="whitespace-pre-wrap">{summary}</p>
                </div>
            )}
        </div>
    );
};

export default AISummary;
