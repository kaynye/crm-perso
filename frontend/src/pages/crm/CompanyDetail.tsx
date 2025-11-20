import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';

const CompanyDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const response = await api.get(`/crm/companies/${id}/`);
                setCompany(response.data);
            } catch (error) {
                console.error("Failed to fetch company", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCompany();
    }, [id]);

    if (loading) return <div className="p-8">Loading...</div>;
    if (!company) return <div className="p-8">Company not found</div>;

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Company Information</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Details and contacts.</p>
                </div>
                <div className="border-t border-gray-200">
                    <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Name</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{company.name}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Industry</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{company.industry}</dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Website</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{company.website}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-4">Contacts</h3>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {company.contacts && company.contacts.map((contact: any) => (
                        <li key={contact.id}>
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-indigo-600 truncate">{contact.first_name} {contact.last_name}</p>
                                    <p className="text-sm text-gray-500">{contact.email}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                    {(!company.contacts || company.contacts.length === 0) && (
                        <li className="px-4 py-4 text-sm text-gray-500">No contacts found.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default CompanyDetail;
