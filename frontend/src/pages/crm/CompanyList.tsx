import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Plus } from 'lucide-react';

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
        const name = prompt("Company Name:");
        if (name) {
            try {
                const response = await api.post('/crm/companies/', { name });
                navigate(`/crm/companies/${response.data.id}`);
            } catch (error) {
                console.error("Failed to create company", error);
            }
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
                <button onClick={createCompany} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    <Plus size={16} className="mr-2" />
                    New Company
                </button>
            </div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {companies.map((company) => (
                        <li key={company.id}>
                            <div onClick={() => navigate(`/crm/companies/${company.id}`)} className="block hover:bg-gray-50 cursor-pointer">
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-indigo-600 truncate">{company.name}</p>
                                        <div className="ml-2 flex-shrink-0 flex">
                                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {company.industry || 'No Industry'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                {company.website || 'No Website'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default CompanyList;
