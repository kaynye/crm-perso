import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestForToken, onMessageListener } from '../../lib/firebase';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string;
    is_read: boolean;
    created_at: string;
    actor_name: string;
}

interface NotificationBellProps {
    direction?: 'up' | 'down';
    align?: 'left' | 'right';
}

const NotificationBell: React.FC<NotificationBellProps> = ({ direction = 'down', align = 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Init Firebase Push Notifications
    useEffect(() => {
        requestForToken();

        onMessageListener()
            .then((payload: any) => {
                console.log('Received foreground message: ', payload);
                // Refetch notifications to reflect the new push natively
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            })
            .catch((err) => console.log('failed: ', err));
    }, [queryClient]);

    // Fetch notifications
    const { data: notifications = [] } = useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { data } = await api.get('/notifications/');
            // Handle both paginated (Django REST standard) and unpaginated responses
            return Array.isArray(data) ? data : (data.results || []);
        },
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/notifications/${id}/mark_read/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            await api.post('/notifications/mark_all_read/');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsReadMutation.mutate(notification.id);
        }
        setIsOpen(false);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && !(event.target as Element).closest('.notification-container')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative notification-container flex items-center justify-center">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                title="Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 text-[8px] text-white items-center justify-center font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={clsx(
                    "absolute w-80 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-800 z-[110] overflow-hidden flex flex-col max-h-[400px]",
                    direction === 'up' ? "bottom-full mb-2" : "top-full mt-2",
                    align === 'left' ? "left-0" : "right-0"
                )}>
                    <div className="p-3 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50">
                        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsReadMutation.mutate()}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center transition-colors"
                            >
                                <Check size={12} className="mr-1" />
                                Tout marquer lu
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto w-full">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                Aucune notification
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={clsx(
                                            "p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors w-full break-words whitespace-normal",
                                            !notification.is_read ? "bg-indigo-50/30 dark:bg-indigo-900/10" : "opacity-70"
                                        )}
                                    >
                                        <div className="flex items-start">
                                            {!notification.is_read && (
                                                <div className="mt-1.5 mr-2 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0 pr-1">
                                                <p className={clsx(
                                                    "text-sm font-medium mb-0.5",
                                                    !notification.is_read ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                <div className="text-[10px] text-gray-400 mt-2 flex items-center justify-between">
                                                    <span>{notification.actor_name}</span>
                                                    <span>
                                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
