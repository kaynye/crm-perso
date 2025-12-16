import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import GuestLayout from '../../components/GuestLayout';
import GuestTasks from './components/GuestTasks';
import GuestMeetings from './components/GuestMeetings';
import GuestDocuments from './components/GuestDocuments';
import { editorStyles } from './utils/parsers';

interface Config {
    title: string;
    type: string;
    company_name: string;
    permissions: {
        allow_tasks: boolean;
        allow_task_creation: boolean;
        allow_meetings: boolean;
        allow_meeting_creation: boolean;
        allow_documents: boolean;
        allow_document_upload: boolean;
    };
}

interface GuestPasswordPromptProps {
    onSubmit: (password: string) => void;
    error?: string;
}

const GuestPasswordPrompt: React.FC<GuestPasswordPromptProps> = ({ onSubmit, error }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(password);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Accès Protégé</h2>
                    <p className="text-gray-500 mt-2">Ce lien est protégé par un mot de passe.</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3"
                            placeholder="Entrez le mot de passe"
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                        Accéder
                    </button>
                </form>
            </div>
        </div>
    );
};

const SharedView: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('');

    // Auth State
    const [authPassword, setAuthPassword] = useState<string | null>(null);
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const fetchConfig = async (password?: string) => {
        setLoading(true);
        try {
            const headers: any = {};
            if (password) {
                headers['X-Shared-Link-Password'] = password;
            }

            const response = await api.get(`/crm/public/config/?token=${token}`, { headers });

            // Check if backend returned "Password Required" with 200 OK
            if (response.data.code === 'password_required' || response.data.code === 'invalid_password') {
                setShowPasswordPrompt(true);
                if (password) setAuthError("Mot de passe incorrect");
                setLoading(false);
                return;
            }

            setConfig(response.data);
            setShowPasswordPrompt(false);
            setAuthError(null);
            if (password) setAuthPassword(password);

            // Set default active tab
            const perms = response.data.permissions;
            if (!activeTab && perms) {
                if (perms.allow_tasks) setActiveTab('tasks');
                else if (perms.allow_meetings) setActiveTab('meetings');
                else if (perms.allow_documents) setActiveTab('documents');
            }

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.status === 401) {
                const code = err.response.data?.code;
                if (code === 'password_required' || code === 'invalid_password') {
                    setShowPasswordPrompt(true);
                    if (password) setAuthError("Mot de passe incorrect");
                } else {
                    setError('Accès non autorisé.');
                }
            } else {
                setError('Lien invalide ou expiré.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchConfig();
        }
    }, [token]);

    const handlePasswordSubmit = (password: string) => {
        fetchConfig(password);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (showPasswordPrompt) {
        return <GuestPasswordPrompt onSubmit={handlePasswordSubmit} error={authError || undefined} />;
    }

    if (error || !config) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="text-red-500 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{error || 'Une erreur est survenue'}</h2>
                <p className="text-gray-500 mt-2 text-center">Veuillez demander un nouveau lien.</p>
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'tasks':
                return <GuestTasks token={token!} canPropose={config?.permissions.allow_task_creation || false} authPassword={authPassword} />;
            case 'meetings':
                return <GuestMeetings token={token!} canPropose={config?.permissions.allow_meeting_creation || false} authPassword={authPassword} />;
            case 'documents':
                return <GuestDocuments token={token!} canUpload={config?.permissions.allow_document_upload || false} authPassword={authPassword} />;
            default:
                return <div>Sélectionnez un onglet</div>;
        }
    };

    return (
        <GuestLayout title={config.title} subtitle={config.company_name}>
            <style>{editorStyles}</style>
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {config.permissions.allow_tasks && (
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`${activeTab === 'tasks'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Tâches & Planning
                        </button>
                    )}
                    {config.permissions.allow_meetings && (
                        <button
                            onClick={() => setActiveTab('meetings')}
                            className={`${activeTab === 'meetings'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Réunions
                        </button>
                    )}
                    {config.permissions.allow_documents && (
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`${activeTab === 'documents'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Documents
                        </button>
                    )}
                </nav>
            </div>

            <div className="min-h-[400px]">
                {renderTabContent()}
            </div>
        </GuestLayout>
    );
};

export default SharedView;
