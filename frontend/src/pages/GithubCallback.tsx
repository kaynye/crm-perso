import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

const GithubCallback: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');

        if (!code) {
            setStatus('error');
            setErrorMsg('Aucun code d\'autorisation trouvé.');
            return;
        }

        const exchangeToken = async () => {
            try {
                // Send code to backend
                await api.post('/integrations/github/callback/', { code });

                // We can just reload the page to force the context to re-fetch the user details
                // since fetchUser is not exposed in AuthContext
                setStatus('success');

                setTimeout(() => {
                    window.location.href = '/profile';
                }, 1500);

            } catch (err: any) {
                console.error('Failed to exchange GitHub token', err);
                setStatus('error');
                setErrorMsg(err.response?.data?.error || 'Erreur lors de la connexion à GitHub');
            }
        };

        exchangeToken();
    }, [location, navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <div className="mb-6 flex justify-center">
                        <svg className="w-16 h-16 text-gray-900 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path>
                        </svg>
                    </div>

                    {status === 'loading' && (
                        <div>
                            <div className="mx-auto w-8 h-8 rounded-full border-b-2 border-gray-900 animate-spin mb-4"></div>
                            <h2 className="text-xl font-medium text-gray-900">Connexion à GitHub...</h2>
                            <p className="mt-2 text-sm text-gray-500">Veuillez patienter pendant l'autorisation.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div>
                            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-medium text-gray-900">Connexion réussie !</h2>
                            <p className="mt-2 text-sm text-gray-500">Redirection vers votre profil...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div>
                            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-medium text-gray-900">Échec de la connexion</h2>
                            <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
                            <button
                                onClick={() => navigate('/profile')}
                                className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Retour au profil
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GithubCallback;
