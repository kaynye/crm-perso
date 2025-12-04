import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Save, Trash2, Upload } from 'lucide-react';

const ContractForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        title: '',
        company: '',
        amount: '',
        start_date: '',
        end_date: '',
        status: 'draft',
        file: null as File | null,
    });
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const companiesRes = await api.get('/crm/companies/');
                if (companiesRes.data.results) {
                    setCompanies(companiesRes.data.results);
                } else {
                    setCompanies(companiesRes.data);
                }

                if (isEditMode) {
                    const contractRes = await api.get(`/crm/contracts/${id}/`);
                    const contract = contractRes.data;
                    setFormData({
                        title: contract.title,
                        company: contract.company,
                        amount: contract.amount || '',
                        start_date: contract.start_date || '',
                        end_date: contract.end_date || '',
                        status: contract.status,
                        file: null, // File input can't be pre-filled securely
                    });
                } else {
                    const companyId = searchParams.get('company');
                    setFormData(prev => ({ ...prev, company: companyId || '' }));
                }
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('title', formData.title);
        data.append('company', formData.company);
        data.append('status', formData.status);
        if (formData.amount) data.append('amount', formData.amount);
        if (formData.start_date) data.append('start_date', formData.start_date);
        if (formData.end_date) data.append('end_date', formData.end_date);
        if (formData.file) data.append('file', formData.file);

        try {
            if (isEditMode) {
                await api.patch(`/crm/contracts/${id}/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/crm/contracts/', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            navigate(-1);
        } catch (error) {
            console.error("Failed to save contract", error);
            alert("Échec de l'enregistrement du contrat");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
            try {
                await api.delete(`/crm/contracts/${id}/`);
                navigate('/crm/companies'); // Or back to where we came from
            } catch (error) {
                console.error("Failed to delete contract", error);
                alert("Échec de la suppression du contrat");
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
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditMode ? 'Modifier le contrat' : 'Nouveau contrat'}
                    </h1>
                </div>
                {isEditMode && (
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100"
                    >
                        <Trash2 size={16} />
                        Supprimer le contrat
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre du contrat</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="ex: Contrat de service annuel"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
                        <select
                            required
                            value={formData.company}
                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Sélectionner une entreprise</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">€</span>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                        <input
                            type="date"
                            value={formData.start_date}
                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                        <input
                            type="date"
                            value={formData.end_date}
                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="draft">Brouillon</option>
                            <option value="active">Actif</option>
                            <option value="signed">Signé</option>
                            <option value="finished">Terminé</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Document du contrat</label>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer w-full">
                                <Upload size={16} />
                                <span className="truncate">{formData.file ? formData.file.name : 'Télécharger PDF...'}</span>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={e => setFormData({ ...formData, file: e.target.files ? e.target.files[0] : null })}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Enregistrement...' : 'Enregistrer le contrat'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ContractForm;
