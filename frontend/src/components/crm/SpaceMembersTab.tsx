import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import clsx from 'clsx';

interface SpaceMembersTabProps {
    spaceId: string;
}

const SpaceMembersTab: React.FC<SpaceMembersTabProps> = ({ spaceId }) => {
    const [members, setMembers] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedRole, setSelectedRole] = useState('editor');
    const [isEditing, setIsEditing] = useState<string | null>(null);

    useEffect(() => {
        fetchMembers();
        fetchUsers();
    }, [spaceId]);

    const fetchMembers = async () => {
        try {
            const response = await api.get(`/crm/space-members/?space=${spaceId}`);
            setMembers(response.data.results || response.data);
        } catch (error) {
            console.error('Failed to fetch members', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/');
            setUsers(response.data.results || response.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const handleSaveMember = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.patch(`/crm/space-members/${isEditing}/`, {
                    role: selectedRole
                });
            } else {
                await api.post('/crm/space-members/', {
                    space: spaceId,
                    user: selectedUser,
                    role: selectedRole
                });
            }
            setShowModal(false);
            setIsEditing(null);
            setSelectedUser('');
            setSelectedRole('editor');
            fetchMembers();
        } catch (error) {
            console.error('Failed to save member', error);
            alert("Erreur lors de l'enregistrement du membre");
        }
    };

    const handleDeleteMember = async (id: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir retirer ce membre ?")) return;
        try {
            await api.delete(`/crm/space-members/${id}/`);
            fetchMembers();
        } catch (error) {
            console.error('Failed to delete member', error);
        }
    };

    const openEditModal = (member: any) => {
        setIsEditing(member.id);
        setSelectedUser(member.user);
        setSelectedRole(member.role);
        setShowModal(true);
    };

    if (loading) {
        return <div className="text-center p-8 text-gray-500">Chargement des membres...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Membres</h3>
                <button
                    onClick={() => {
                        setIsEditing(null);
                        setSelectedUser('');
                        setSelectedRole('editor');
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                    <Plus size={16} />
                    <span>Ajouter un membre</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {members.map(member => (
                            <tr key={member.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {member.user_details?.first_name} {member.user_details?.last_name}
                                            </div>
                                            <div className="text-sm text-gray-500">{member.user_details?.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={clsx(
                                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                        member.role === 'admin' ? "bg-purple-100 text-purple-800" :
                                            member.role === 'editor' ? "bg-green-100 text-green-800" :
                                                "bg-gray-100 text-gray-800"
                                    )}>
                                        {member.role === 'admin' ? 'Administrateur' : member.role === 'editor' ? 'Éditeur' : 'Spectateur'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => openEditModal(member)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMember(member.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {members.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                    Aucun membre assigné à cet espace.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {isEditing ? 'Modifier le membre' : 'Ajouter un membre'}
                        </h3>
                        <form onSubmit={handleSaveMember} className="space-y-4">
                            {!isEditing && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur</label>
                                    <select
                                        required
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="">Sélectionner un utilisateur</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                                <select
                                    required
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="admin">Administrateur</option>
                                    <option value="editor">Éditeur</option>
                                    <option value="spectator">Spectateur</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpaceMembersTab;
