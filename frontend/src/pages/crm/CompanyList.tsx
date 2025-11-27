import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Plus, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import ActionsMenu from '../../components/ActionsMenu';

const CompanyList: React.FC = () => {
    const [companies, setCompanies] = useState<any[]>([]);
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

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
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
            try {
                await api.delete(`/crm/companies/${id}/`);
                fetchCompanies();
            } catch (error) {
                console.error("Failed to delete company", error);
            }
        }
    };

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedCompanies = [...filteredCompanies].sort((a, b) => {
        if (!sortConfig) return 0;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle special cases
        if (sortConfig.key === 'created_at') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
        } else {
            // Case insensitive string comparison
            aValue = aValue ? aValue.toString().toLowerCase() : '';
            bValue = bValue ? bValue.toString().toLowerCase() : '';
        }

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-gray-400" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="ml-1 text-black" />
            : <ArrowDown size={14} className="ml-1 text-black" />;
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Entreprises</h1>
                    <p className="text-gray-500 mt-1">Gérez votre portefeuille clients</p>
                </div>
                <button onClick={createCompany} className="w-full md:w-auto flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm text-sm font-medium">
                    <Plus size={16} className="mr-2" />
                    Nouvelle Entreprise
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Rechercher une entreprise..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                onClick={() => requestSort('name')}
                            >
                                <div className="flex items-center">
                                    Nom <SortIcon columnKey="name" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                onClick={() => requestSort('industry')}
                            >
                                <div className="flex items-center">
                                    Secteur <SortIcon columnKey="industry" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                onClick={() => requestSort('website')}
                            >
                                <div className="flex items-center">
                                    Site Web <SortIcon columnKey="website" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                onClick={() => requestSort('created_at')}
                            >
                                <div className="flex items-center">
                                    Créé le <SortIcon columnKey="created_at" />
                                </div>
                            </th>
                            <th className="relative px-6 py-4">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {sortedCompanies.map((company) => (
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
                        {sortedCompanies.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    Aucune entreprise trouvée
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {sortedCompanies.map((company) => (
                    <div key={company.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                            <Link to={`/crm/companies/${company.id}`} className="text-lg font-semibold text-gray-900">
                                {company.name}
                            </Link>
                            <ActionsMenu
                                onEdit={() => navigate(`/crm/companies/${company.id}`)}
                                onDelete={() => deleteCompany(company.id)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-500">Secteur</div>
                            <div className="text-gray-900 font-medium text-right">{company.industry || '-'}</div>

                            <div className="text-gray-500">Site Web</div>
                            <div className="text-right">
                                {company.website ? (
                                    <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-500 flex items-center justify-end">
                                        Site <ExternalLink size={12} className="ml-1" />
                                    </a>
                                ) : '-'}
                            </div>

                            <div className="text-gray-500">Créé le</div>
                            <div className="text-gray-900 text-right">{new Date(company.created_at).toLocaleDateString('fr-FR')}</div>
                        </div>
                    </div>
                ))}
                {filteredCompanies.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        Aucune entreprise trouvée
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanyList;
