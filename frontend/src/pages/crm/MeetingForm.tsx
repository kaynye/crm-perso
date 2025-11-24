import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

const MeetingForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        title: '',
        date: '',
        type: 'video',
        company: '',
        contract: '',
    });
    const [companies, setCompanies] = useState<any[]>([]);
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch companies for dropdown
                const companiesRes = await api.get('/crm/companies/');
                setCompanies(companiesRes.data);

                // If editing, fetch meeting details
                if (isEditMode) {
                    const meetingRes = await api.get(`/crm/meetings/${id}/`);
                    const meeting = meetingRes.data;

                    // Fetch contracts for the selected company
                    if (meeting.company) {
                        const contractsRes = await api.get(`/crm/contracts/?company=${meeting.company}`);
                        setContracts(contractsRes.data);
                    }

                    setFormData({
                        title: meeting.title,
                        date: meeting.date ? new Date(meeting.date).toISOString().slice(0, 16) : '',
                        type: meeting.type,
                        company: meeting.company,
                        contract: meeting.contract || '',
                    });
                } else {
                    // Initialize from URL params if creating new
                    const companyId = searchParams.get('company');
                    const contractId = searchParams.get('contract');

                    if (companyId) {
                        const contractsRes = await api.get(`/crm/contracts/?company=${companyId}`);
                        setContracts(contractsRes.data);
                    }

                    setFormData(prev => ({
                        ...prev,
                        company: companyId || '',
                        contract: contractId || '',
                    }));
                }
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id, searchParams]);

    const handleCompanyChange = async (companyId: string) => {
        setFormData(prev => ({ ...prev, company: companyId, contract: '' }));
        if (companyId) {
            try {
                const res = await api.get(`/crm/contracts/?company=${companyId}`);
                setContracts(res.data);
            } catch (error) {
                console.error("Failed to fetch contracts", error);
            }
        } else {
            setContracts([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload: any = {
            title: formData.title,
            type: formData.type,
            company: formData.company,
            contract: formData.contract || null,
        };

        if (formData.date) {
            payload.date = new Date(formData.date).toISOString();
        }

        try {
            if (isEditMode) {
                await api.patch(`/crm/meetings/${id}/`, payload);
            } else {
                await api.post('/crm/meetings/', payload);
            }
            navigate(-1);
        } catch (error) {
            console.error("Failed to save meeting", error);
            alert("Échec de l'enregistrement de la réunion");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réunion ?')) {
            try {
                await api.delete(`/crm/meetings/${id}/`);
                navigate('/crm/companies'); // Or back to where we came from
            } catch (error) {
                console.error("Failed to delete meeting", error);
                alert("Échec de la suppression de la réunion");
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
                        {isEditMode ? 'Modifier la réunion' : 'Nouvelle réunion'}
                    </h1>
                </div>
                {isEditMode && (
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100"
                    >
                        <Trash2 size={16} />
                        Supprimer la réunion
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Titre de la réunion"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
                        <select
                            required
                            value={formData.company}
                            onChange={e => handleCompanyChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Sélectionner une entreprise</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contrat (Optionnel)</label>
                        <select
                            value={formData.contract}
                            onChange={e => setFormData({ ...formData, contract: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            disabled={!formData.company}
                        >
                            <option value="">Sélectionner un contrat</option>
                            {contracts.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Lier à un contrat est recommandé.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date et Heure</label>
                        <input
                            type="datetime-local"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="video">Visioconférence</option>
                            <option value="phone">Téléphone</option>
                            <option value="in_person">En personne</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Enregistrement...' : 'Enregistrer la réunion'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MeetingForm;
