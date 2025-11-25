import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Plus, ExternalLink } from 'lucide-react';
import ActionsMenu from '../../components/ActionsMenu';

const CompanyList: React.FC = () => {
    const [companies, setCompanies] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const response = await api.get('/crm/companies/');
            setCompanies(response.data);
        } catch (error) {
            console.error("Failed to fetch companies", error);
        }
    };

    const createCompany = async () => {
        const name = prompt("Nom de l'entreprise :");
        if (name) {
            try {
                const response = await api.post('/crm/companies/', { name });
                navigate(`/crm/companies/${response.data.id}`);
            } catch (error) {
                console.error("Failed to create company", error);
            }
        }
    };

    const deleteCompany = async (id: string) => {
        try {
            await api.delete(`/crm/companies/${id}/`);
            fetchCompanies();
        } catch (error) {
            console.error("Failed to delete company", error);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Entreprises</h1>
                <button onClick={createCompany} className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm text-sm font-medium">
                    <Plus size={16} className="mr-2" />
                    Nouvelle Entreprise
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Secteur</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Site Web</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Créé le</th>
                            <th className="relative px-6 py-4">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {companies.map((company) => (
                            <tr key={company.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link to={`/crm/companies/${company.id}`} className="text-gray-900 hover:text-black font-medium">
                                        {company.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.industry || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {company.website ? (
                                        <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center">
                                            {company.website} <ExternalLink size={12} className="ml-1" />
                                        </a>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(company.created_at).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ActionsMenu
                                        onEdit={() => navigate(`/crm/companies/${company.id}`)}
                                        onDelete={() => deleteCompany(company.id)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CompanyList;
