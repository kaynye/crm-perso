import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Save, Trash2, Upload, FileText } from 'lucide-react';
import Editor from '../../components/Editor';
import type { OutputData } from '@editorjs/editorjs';
import { parseEditorJsData } from '../../utils/editorjs-html';
import { generatePDF } from '../../utils/pdf-generator';
import { useAuth } from '../../context/AuthContext';

const ContractForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const { user } = useAuth();
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
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [editorData, setEditorData] = useState<OutputData>({ blocks: [] });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [companiesRes, templatesRes] = await Promise.all([
                    api.get('/crm/companies/'),
                    api.get('/crm/contract-templates/')
                ]);

                if (companiesRes.data.results) {
                    setCompanies(companiesRes.data.results);
                } else {
                    setCompanies(companiesRes.data);
                }

                if (templatesRes.data.results) {
                    setTemplates(templatesRes.data.results);
                } else {
                    setTemplates(templatesRes.data);
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
                        file: null,
                    });
                    if (contract.content && Object.keys(contract.content).length > 0) {
                        setEditorData(contract.content);
                    }
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

    const injectTemplateData = (content: any, companyId: string) => {
        let stringified = JSON.stringify(content);

        const company = companies.find(c => c.id === companyId);

        // Client details
        if (company) {
            stringified = stringified.replace(/\{\{\s*client_name\s*\}\}/g, company.name || '');
            stringified = stringified.replace(/\{\{\s*client_address\s*\}\}/g, company.address || '');
            // Company custom fields could be added here
        }

        // Contract details
        stringified = stringified.replace(/\{\{\s*contract_title\s*\}\}/g, formData.title || '');
        stringified = stringified.replace(/\{\{\s*contract_amount\s*\}\}/g, formData.amount ? `${formData.amount} €` : '');
        stringified = stringified.replace(/\{\{\s*contract_start_date\s*\}\}/g, formData.start_date ? new Date(formData.start_date).toLocaleDateString('fr-FR') : '');
        stringified = stringified.replace(/\{\{\s*contract_end_date\s*\}\}/g, formData.end_date ? new Date(formData.end_date).toLocaleDateString('fr-FR') : '');

        // User/Org details (fromAuth)
        if (user) {
            stringified = stringified.replace(/\{\{\s*user_name\s*\}\}/g, `${user.first_name} ${user.last_name}`.trim() || user.username);
            stringified = stringified.replace(/\{\{\s*user_email\s*\}\}/g, user.email || '');
            if (user.organization) {
                stringified = stringified.replace(/\{\{\s*org_name\s*\}\}/g, (user as any).organization_name || 'Votre Organisation');
            }
        }

        return JSON.parse(stringified);
    };

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);
        if (!templateId) return;

        const template = templates.find(t => t.id === templateId);
        if (template && template.content) {
            // Apply injection immediately when loading template
            const dataToInject = injectTemplateData(template.content, formData.company);
            setEditorData(dataToInject);
        }
    };

    const handleEditorChange = (data: OutputData) => {
        setEditorData(data);
    };

    const handleGeneratePDF = async () => {
        // Inject variables into current editorData before generating PDF
        const contentWithVariables = injectTemplateData(editorData, formData.company);
        const content_html = parseEditorJsData(contentWithVariables);

        generatePDF({
            title: '', // Empty title to avoid header in PDF body
            contentHTML: content_html,
            metadata: '',
            filename: `${formData.title.replace(/\s+/g, '_')}.pdf`
        });
    };

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

        // Add EditorJS content
        if (editorData && editorData.blocks && editorData.blocks.length > 0) {
            data.append('content', JSON.stringify(editorData));
        }

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
                navigate('/crm/companies');
            } catch (error) {
                console.error("Failed to delete contract", error);
                alert("Échec de la suppression du contrat");
            }
        }
    };

    if (initialLoading) return <div className="p-8">Chargement...</div>;

    return (
        <div className="max-w-[1600px] mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditMode ? 'Modifier le contrat' : 'Nouveau contrat'}
                    </h1>
                </div>
                <div className="flex gap-2">
                    {/* Primary Actions now in header for easy access */}
                    <button
                        onClick={(e) => handleSubmit(e as any)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? '...' : 'Enregistrer'}
                    </button>
                    {isEditMode && (
                        <>
                            <button
                                type="button"
                                onClick={handleGeneratePDF}
                                className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-100"
                            >
                                <FileText size={16} />
                                PDF
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LEFT SIDEBAR: Inputs & Variables (Span 4) */}
                <div className="lg:col-span-4 space-y-6 sticky top-6">

                    {/* Contract Configuration Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                        <h2 className="font-semibold text-gray-900 border-b pb-2">Configuration</h2>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Titre</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Titre du contrat"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Entreprise Client</label>
                            <select
                                required
                                value={formData.company}
                                onChange={e => setFormData({ ...formData, company: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Choisir...</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Montant</label>
                                <div className="relative">
                                    <span className="absolute left-2 top-2 text-gray-500 text-xs">€</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="draft">Brouillon</option>
                                    <option value="active">Actif</option>
                                    <option value="signed">Signé</option>
                                    <option value="finished">Terminé</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Début</label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Fin</label>
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Fichier joint</label>
                            <label className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 border border-dashed border-gray-300 rounded-md text-xs text-gray-600 hover:bg-gray-100 cursor-pointer w-full transition-colors">
                                <Upload size={14} />
                                <span className="truncate max-w-[200px]">{formData.file ? formData.file.name : 'Ajouter un PDF/Doc...'}</span>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={e => setFormData({ ...formData, file: e.target.files ? e.target.files[0] : null })}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Variables Helper Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h3 className="font-semibold text-gray-900 text-sm mb-3">Variables Dynamiques</h3>
                        <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                            {[
                                { label: 'Client (Nom)', val: '{{client_name}}' },
                                { label: 'Client (Adresse)', val: '{{client_address}}' },
                                { label: 'Contrat (Titre)', val: '{{contract_title}}' },
                                { label: 'Contrat (Montant)', val: '{{contract_amount}}' },
                                { label: 'Contrat (Début)', val: '{{contract_start_date}}' },
                                { label: 'Contrat (Fin)', val: '{{contract_end_date}}' },
                                { label: 'Moi (Nom)', val: '{{user_name}}' },
                                { label: 'Moi (Email)', val: '{{user_email}}' },
                                { label: 'Moi (Org)', val: '{{org_name}}' },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    onClick={() => navigator.clipboard.writeText(item.val)}
                                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer group border border-transparent hover:border-gray-200"
                                >
                                    <span className="text-xs text-gray-600">{item.label}</span>
                                    <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono group-hover:text-indigo-600 group-hover:bg-indigo-50">{item.val}</code>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT MAIN: Editor Area (Span 8) */}
                <div className="lg:col-span-8 flex flex-col gap-4">

                    {/* Template Toolbar */}
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">Modèle :</span>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">-- Choisir un modèle pour démarrer --</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* A4 Editor Stage */}
                    <div className="bg-gray-100 rounded-xl border border-gray-300 p-8 overflow-auto flex justify-center min-h-[calc(100vh-200px)]">
                        <div
                            className="bg-white shadow-xl min-h-[297mm] w-[210mm] shrink-0 transition-transform origin-top"
                            style={{
                                width: '210mm',
                                padding: '2.5cm',
                            }}
                        >
                            <Editor
                                data={editorData}
                                onChange={handleEditorChange}
                                readOnly={false}
                            />
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
};

export default ContractForm;
