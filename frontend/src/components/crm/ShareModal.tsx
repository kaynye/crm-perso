import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Copy, Plus, Trash2, X, ExternalLink } from 'lucide-react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    contractId?: string;
    companyId?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, contractId, companyId }) => {
    const [links, setLinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // New Link State
    const [allowTasks, setAllowTasks] = useState(true);
    const [allowTaskCreation, setAllowTaskCreation] = useState(false);
    const [allowMeetings, setAllowMeetings] = useState(true);
    const [allowDocuments, setAllowDocuments] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchLinks();
        }
    }, [isOpen, contractId, companyId]);

    const fetchLinks = async () => {
        setLoading(true);
        try {
            // Filter by contract or company
            const params = contractId ? { contract: contractId } : { company: companyId };
            const res = await api.get('/crm/shared-links/', { params });
            // Handle pagination if present
            setLinks(res.data.results || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const createLink = async () => {
        try {
            const payload = {
                contract: contractId,
                company: companyId,
                allow_tasks: allowTasks,
                allow_task_creation: allowTaskCreation,
                allow_meetings: allowMeetings,
                allow_documents: allowDocuments
            };
            await api.post('/crm/shared-links/', payload);
            fetchLinks();
        } catch (err) {
            console.error(err);
            alert("Failed to generate link");
        }
    };

    const deleteLink = async (id: string) => {
        if (!window.confirm("Revoke this link access?")) return;
        try {
            await api.delete(`/crm/shared-links/${id}/`);
            fetchLinks();
        } catch (err) {
            console.error(err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">Share Access</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6">
                    {/* Create New Section */}
                    <div className="bg-indigo-50/50 rounded-lg p-4 mb-6 border border-indigo-100">
                        <h4 className="text-sm font-medium text-indigo-900 mb-3">Generate new public link</h4>
                        <div className="flex flex-col gap-3 mb-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none font-medium">
                                    <input type="checkbox" checked={allowTasks} onChange={e => setAllowTasks(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                    Tasks
                                </label>
                                {allowTasks && (
                                    <div className="ml-6 animate-fade-in-down">
                                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={allowTaskCreation}
                                                onChange={e => setAllowTaskCreation(e.target.checked)}
                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                            Allow guests to propose tasks
                                        </label>
                                    </div>
                                )}
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none font-medium">
                                <input type="checkbox" checked={allowMeetings} onChange={e => setAllowMeetings(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                Meetings
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none font-medium">
                                <input type="checkbox" checked={allowDocuments} onChange={e => setAllowDocuments(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                Documents
                            </label>
                        </div>
                        <button onClick={createLink} className="w-full py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors shadow-sm">
                            <Plus size={16} /> Generate Link
                        </button>
                    </div>

                    {/* Existing Links */}
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center justify-between">
                        Active Links <span className="text-xs font-normal text-gray-500">{links.length} links</span>
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {links.map(link => (
                            <div key={link.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between bg-white hover:border-indigo-300 transition-colors">
                                <div className="flex-1 min-w-0 mr-4">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                        {link.allow_tasks && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">Tasks</span>}
                                        {link.allow_task_creation && <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100">Can Propose</span>}
                                        {link.allow_meetings && <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100">Meetings</span>}
                                        {link.allow_documents && <span className="bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded border border-yellow-100">Docs</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            readOnly
                                            value={`${window.location.origin}/shared/${link.token}`}
                                            className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 w-full truncate focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            onClick={(e) => e.currentTarget.select()}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/shared/${link.token}`);
                                        }}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <a
                                        href={`/shared/${link.token}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                        title="Open in new tab"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                    <button
                                        onClick={() => deleteLink(link.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Revoke access"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {links.length === 0 && !loading && (
                            <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-400">No active links found for this project.</p>
                            </div>
                        )}
                        {loading && <p className="text-center text-xs text-gray-400">Loading...</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
