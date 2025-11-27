import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Loader2 } from 'lucide-react';

const GoogleCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Connexion à Google en cours...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            api.post('/integrations/google/callback/', { code })
                .then(() => {
                    setStatus('Connexion réussie ! Redirection...');
                    setTimeout(() => navigate('/profile'), 2000);
                })
                .catch((err) => {
                    console.error(err);
                    setError('Erreur lors de la connexion : ' + (err.response?.data?.error || err.message));
                    setStatus('Échec de la connexion.');
                });
        } else {
            setError('Aucun code d\'autorisation fourni.');
            setStatus('Erreur.');
        }
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                {error ? (
                    <div className="text-red-600 mb-4">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <h2 className="text-xl font-bold mb-2">Erreur</h2>
                        <p>{error}</p>
                        <button onClick={() => navigate('/profile')} className="mt-4 text-indigo-600 hover:text-indigo-800">Retour au profil</button>
                    </div>
                ) : (
                    <div>
                        <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-600 animate-spin" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{status}</h2>
                        <p className="text-gray-500">Veuillez patienter...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoogleCallback;
