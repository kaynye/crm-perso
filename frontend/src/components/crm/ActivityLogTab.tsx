import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Activity, File, Briefcase, Users, Calendar, CheckSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityLog {
    id: string;
    actor_name: string;
    action: 'created' | 'updated' | 'deleted';
    entity_type: string;
    entity_name: string;
    timestamp: string;
    details?: Record<string, any>;
}

interface ActivityLogTabProps {
    spaceId: string;
}

const ActivityLogTab: React.FC<ActivityLogTabProps> = ({ spaceId }) => {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const response = await api.get(`/crm/activities/?space=${spaceId}`);
                if (response.data.results) {
                    setActivities(response.data.results);
                } else if (Array.isArray(response.data)) {
                    setActivities(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch activities", error);
            } finally {
                setLoading(false);
            }
        };

        if (spaceId) {
            fetchActivities();
        }
    }, [spaceId]);

    const getActionText = (action: string) => {
        switch (action) {
            case 'created': return 'a ajouté';
            case 'updated': return 'a modifié';
            case 'deleted': return 'a supprimé';
            default: return 'a interagi avec';
        }
    };

    const getEntityIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'document': return <File size={16} className="text-blue-500" />;
            case 'contrat': return <Briefcase size={16} className="text-purple-500" />;
            case 'membre': return <Users size={16} className="text-orange-500" />;
            case 'réunion': return <Calendar size={16} className="text-green-500" />;
            case 'tâche': return <CheckSquare size={16} className="text-indigo-500" />;
            default: return <Activity size={16} className="text-gray-500" />;
        }
    };

    const renderDetails = (details?: Record<string, any>) => {
        if (!details || Object.keys(details).length === 0) return null;

        return (
            <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-md border border-gray-100 italic">
                {Object.entries(details).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                        <span className="font-medium capitalize">{key}</span>:
                        <span className="line-through text-gray-400">{value.old || 'N/A'}</span>
                        <span>→</span>
                        <span className="text-gray-700">{value.new || 'N/A'}</span>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return <div className="py-8 text-center text-gray-500">Chargement de l'historique...</div>;

    if (activities.length === 0) return (
        <div className="py-12 bg-white rounded-lg border border-gray-200 border-dashed text-center">
            <Activity size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">Aucune activité enregistrée pour le moment.</p>
        </div>
    );

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <Activity size={20} className="mr-2 text-indigo-600" />
                Journal d'Activités
            </h3>
            <div className="flow-root">
                <ul className="-mb-8">
                    {activities.map((activity, itemIdx) => (
                        <li key={activity.id}>
                            <div className="relative pb-8">
                                {itemIdx !== activities.length - 1 ? (
                                    <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-3 items-start">
                                    <div>
                                        <span className="h-8 w-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center ring-8 ring-white">
                                            {getEntityIcon(activity.entity_type)}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex flex-col space-y-2">
                                        <div className="flex justify-between space-x-4">
                                            <p className="text-sm text-gray-500">
                                                <span className="font-medium text-gray-900 mr-1">{activity.actor_name}</span>
                                                {getActionText(activity.action)}{' '}
                                                <span className="lowercase">{activity.entity_type}</span>{' '}
                                                <span className="font-medium text-gray-900">'{activity.entity_name}'</span>
                                            </p>
                                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: fr })}
                                            </div>
                                        </div>
                                        {renderDetails(activity.details)}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ActivityLogTab;
