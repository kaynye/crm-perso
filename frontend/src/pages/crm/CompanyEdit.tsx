import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

const CompanyEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        website: '',
        phone: '',
        email: '',
        address: '',
    });

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const response = await api.get(`/crm/companies/${id}/`);
                setFormData({
                    name: response.data.name,
                    industry: response.data.industry || '',
                    website: response.data.website || '',
                    phone: response.data.phone || '',
                    email: response.data.email || '',
                    address: response.data.address || '',
                });
            } catch (error) {
                console.error("Failed to fetch company", error);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchCompany();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch(`/crm/companies/${id}/`, formData);
            navigate(`/crm/companies/${id}`);
        } catch (error) {
            console.error("Failed to update company", error);
            alert("Échec de la mise à jour de l'entreprise");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ? Cela supprimera également tous les contacts, contrats et réunions associés.')) {
            try {
                await api.delete(`/crm/companies/${id}/`);
                navigate('/crm/companies');
            } catch (error) {
                console.error("Failed to delete company", error);
                alert("Échec de la suppression de l'entreprise");
            }
        }
    };

    if (initialLoading) return <div className="p-8">Chargement...</div>;

    return (
        <div className="max-w-2xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Modifier l'entreprise</h1>
                </div>
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100"
                >
                    <Trash2 size={16} />
                    Supprimer l'entreprise
                </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité</label>
                        <select
                            value={formData.industry}
                            onChange={e => setFormData({ ...formData, industry: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Sélectionner un secteur</option>
                            <option value="technology">Technologie</option>
                            <option value="finance">Finance</option>
                            <option value="healthcare">Santé</option>
                            <option value="retail">Commerce de détail</option>
                            <option value="other">Autre</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Site Web</label>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="https://example.com"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <textarea
                        rows={3}
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanyEdit;
