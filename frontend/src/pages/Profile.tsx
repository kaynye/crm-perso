import React from 'react';
import { User, Mail, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import api from '../api/axios';

const Profile: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
    if (!user) return <div className="p-8 text-center text-gray-500">Utilisateur introuvable</div>;

    const handleConnectGoogle = async () => {
        try {
            const response = await api.get('/integrations/google/login/');
            window.location.href = response.data.url;
        } catch (error) {
            console.error("Failed to get Google Auth URL", error);
            alert("Erreur lors de la connexion à Google.");
        }
    };

    const handleConnectGithub = async () => {
        try {
            const response = await api.get('/integrations/github/login/');
            window.location.href = response.data.url;
        } catch (error) {
            console.error("Failed to get GitHub Auth URL", error);
            alert("Erreur lors de la connexion à GitHub.");
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Mon Profil</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6">
                        <div className="w-32 h-32 rounded-full bg-white p-1 inline-block">
                            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                <User size={64} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Nom</label>
                            <div className="flex items-center text-gray-900 text-lg font-medium">
                                <User className="w-5 h-5 mr-3 text-gray-400" />
                                {user.username || user.email}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                            <div className="flex items-center text-gray-900 text-lg font-medium">
                                <Mail className="w-5 h-5 mr-3 text-gray-400" />
                                {user.email}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Rôle</label>
                            <div className="flex items-center text-gray-900 text-lg font-medium">
                                <Shield className="w-5 h-5 mr-3 text-gray-400" />
                                {user.is_admin ? "Admin" : "Utilisateur"}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Intégrations</h2>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <button
                                    onClick={handleConnectGoogle}
                                    className="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 mr-2" />
                                    {user.has_google_calendar ? "Google Agenda connecté" : "Connecter Google Agenda"}
                                </button>

                                <button
                                    onClick={handleConnectGithub}
                                    className="flex items-center justify-center px-4 py-2 border border-gray-900 shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                                >
                                    <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path>
                                    </svg>
                                    {user.has_github ? "GitHub connecté" : "Connecter GitHub"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
