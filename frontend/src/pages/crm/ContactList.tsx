import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import { Plus, Mail, Phone } from 'lucide-react';
import ActionsMenu from '../../components/ActionsMenu';

const ContactList: React.FC = () => {
    const [contacts, setContacts] = useState<any[]>([]);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const response = await api.get('/crm/contacts/');
            setContacts(response.data);
        } catch (error) {
            console.error("Failed to fetch contacts", error);
        }
    };

    const createContact = async () => {
        // Simplified creation for now
        const firstName = prompt("First Name:");
        const lastName = prompt("Last Name:");
        if (firstName && lastName) {
            try {
                await api.post('/crm/contacts/', { first_name: firstName, last_name: lastName });
                fetchContacts();
            } catch (error) {
                console.error("Failed to create contact", error);
            }
        }
    };

    const deleteContact = async (id: string) => {
        try {
            await api.delete(`/crm/contacts/${id}/`);
            fetchContacts();
        } catch (error) {
            console.error("Failed to delete contact", error);
        }
    };

    const editContact = async (contact: any) => {
        const firstName = prompt("First Name:", contact.first_name);
        const lastName = prompt("Last Name:", contact.last_name);
        if (firstName && lastName) {
            try {
                await api.patch(`/crm/contacts/${contact.id}/`, { first_name: firstName, last_name: lastName });
                fetchContacts();
            } catch (error) {
                console.error("Failed to update contact", error);
            }
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Contacts</h1>
                <button onClick={createContact} className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm text-sm font-medium">
                    <Plus size={16} className="mr-2" />
                    New Contact
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                            <th className="relative px-6 py-4">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {contacts.map((contact) => (
                            <tr key={contact.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{contact.first_name} {contact.last_name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {contact.email ? (
                                        <a href={`mailto:${contact.email}`} className="text-gray-500 hover:text-black flex items-center transition-colors">
                                            <Mail size={14} className="mr-2" /> {contact.email}
                                        </a>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {contact.phone ? (
                                        <a href={`tel:${contact.phone}`} className="text-gray-500 hover:text-black flex items-center transition-colors">
                                            <Phone size={14} className="mr-2" /> {contact.phone}
                                        </a>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {contact.company ? (
                                        <Link to={`/crm/companies/${contact.company.id}`} className="text-blue-600 hover:underline">
                                            {contact.company.name}
                                        </Link>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ActionsMenu
                                        onEdit={() => editContact(contact)}
                                        onDelete={() => deleteContact(contact.id)}
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

export default ContactList;
