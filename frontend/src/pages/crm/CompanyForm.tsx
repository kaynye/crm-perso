import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

const CompanyForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditing);
    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        size: '',
        website: '',
        address: '',
        notes: '',
        tags: '',
    });

    useEffect(() => {
        if (isEditing) {
            const fetchCompany = async () => {
                try {
                    const response = await api.get(`/crm/companies/${id}/`);
                    setFormData({
                        name: response.data.name,
                        industry: response.data.industry || '',
                        size: response.data.size || '',
                        website: response.data.website || '',
                        address: response.data.address || '',
                        notes: response.data.notes || '',
                        tags: response.data.tags || '',
                    });
                } catch (error) {
                    console.error("Failed to fetch company", error);
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchCompany();
        }
    }, [id, isEditing]);

    const handleDelete = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ? Cette action est irréversible et supprimera toutes les données associées (contacts, contrats, réunions).')) {
            try {
                await api.delete(`/crm/companies/${id}/`);
                navigate('/crm/companies');
            } catch (error) {
                console.error("Failed to delete company", error);
                alert("Échec de la suppression");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditing) {
                await api.patch(`/crm/companies/${id}/`, formData);
                navigate(`/crm/companies/${id}`);
            } else {
                const response = await api.post('/crm/companies/', formData);
                navigate(`/crm/companies/${response.data.id}`);
            }
        } catch (error) {
            console.error("Failed to save company", error);
            alert("Échec de l'enregistrement");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="p-8">Chargement...</div>;

    return (
        <div className="max-w-3xl mx-auto p-8">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEditing ? "Modifier l'entreprise" : "Nouvelle entreprise"}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité</label>
                        <input
                            type="text"
                            value={formData.industry}
                            onChange={e => setFormData({ ...formData, industry: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Ex: Technologie, Santé..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Taille</label>
                        <select
                            value={formData.size}
                            onChange={e => setFormData({ ...formData, size: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Sélectionner...</option>
                            <option value="1-10">1-10 employés</option>
                            <option value="11-50">11-50 employés</option>
                            <option value="51-200">51-200 employés</option>
                            <option value="201-500">201-500 employés</option>
                            <option value="500+">500+ employés</option>
                        </select>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Site Web</label>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="https://example.com"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                        <textarea
                            rows={2}
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (séparés par des virgules)</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={e => setFormData({ ...formData, tags: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Client, Prospect, VIP..."
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes internes</label>
                        <textarea
                            rows={4}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-100">
                    {isEditing && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md font-medium transition-colors"
                        >
                            <Trash2 size={18} />
                            Supprimer
                        </button>
                    )}
                    <div className="flex-1 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Save size={18} />
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CompanyForm;
