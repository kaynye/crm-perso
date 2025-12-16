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

const SharedView: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await api.get(`/crm/public/config/?token=${token}`);
                setConfig(response.data);

                // Set default active tab
                const perms = response.data.permissions;
                if (perms.allow_tasks) setActiveTab('tasks');
                else if (perms.allow_meetings) setActiveTab('meetings');
                else if (perms.allow_documents) setActiveTab('documents');

            } catch (err) {
                console.error(err);
                setError('Lien invalide ou expiré.');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchConfig();
        }
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
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
                return <GuestTasks token={token!} canPropose={config?.permissions.allow_task_creation || false} />;
            case 'meetings':
                return <GuestMeetings token={token!} canPropose={config?.permissions.allow_meeting_creation || false} />;
            case 'documents':
                return <GuestDocuments token={token!} canUpload={config?.permissions.allow_document_upload || false} />;
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
