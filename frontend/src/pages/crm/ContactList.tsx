import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import { Plus, Mail, Phone, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import ActionsMenu from '../../components/ActionsMenu';

const ContactList: React.FC = () => {
    const [contacts, setContacts] = useState<any[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'last_name', direction: 'asc' });

    const [searchTerm, setSearchTerm] = useState('');

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
        const firstName = prompt("Prénom :");
        const lastName = prompt("Nom :");
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
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
            try {
                await api.delete(`/crm/contacts/${id}/`);
                fetchContacts();
            } catch (error) {
                console.error("Failed to delete contact", error);
            }
        }
    };

    const editContact = async (contact: any) => {
        const firstName = prompt("Prénom :", contact.first_name);
        const lastName = prompt("Nom :", contact.last_name);
        if (firstName && lastName) {
            try {
                await api.patch(`/crm/contacts/${contact.id}/`, { first_name: firstName, last_name: lastName });
                fetchContacts();
            } catch (error) {
                console.error("Failed to update contact", error);
            }
        }
    };

    const filteredContacts = contacts.filter(contact =>
        contact.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedContacts = [...filteredContacts].sort((a, b) => {
        if (!sortConfig) return 0;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested company name
        if (sortConfig.key === 'company') {
            aValue = a.company ? a.company.name : '';
            bValue = b.company ? b.company.name : '';
        }

        // Case insensitive string comparison
        aValue = aValue ? aValue.toString().toLowerCase() : '';
        bValue = bValue ? bValue.toString().toLowerCase() : '';

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
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Contacts</h1>
                    <p className="text-gray-500 mt-1">Votre carnet d'adresses professionnel</p>
                </div>
                <button onClick={createContact} className="w-full md:w-auto flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm text-sm font-medium">
                    <Plus size={16} className="mr-2" />
                    Nouveau Contact
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Rechercher un contact..."
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
                                onClick={() => requestSort('last_name')}
                            >
                                <div className="flex items-center">
                                    Nom <SortIcon columnKey="last_name" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                onClick={() => requestSort('email')}
                            >
                                <div className="flex items-center">
                                    Email <SortIcon columnKey="email" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                onClick={() => requestSort('phone')}
                            >
                                <div className="flex items-center">
                                    Téléphone <SortIcon columnKey="phone" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                onClick={() => requestSort('company')}
                            >
                                <div className="flex items-center">
                                    Entreprise <SortIcon columnKey="company" />
                                </div>
                            </th>
                            <th className="relative px-6 py-4">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {sortedContacts.map((contact) => (
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
                        {sortedContacts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    Aucun contact trouvé
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {sortedContacts.map((contact) => (
                    <div key={contact.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="font-semibold text-gray-900 text-lg">
                                {contact.first_name} {contact.last_name}
                            </div>
                            <ActionsMenu
                                onEdit={() => editContact(contact)}
                                onDelete={() => deleteContact(contact.id)}
                            />
                        </div>

                        <div className="space-y-2">
                            {contact.email && (
                                <a href={`mailto:${contact.email}`} className="flex items-center text-sm text-gray-600 hover:text-black">
                                    <Mail size={14} className="mr-2 text-gray-400" />
                                    {contact.email}
                                </a>
                            )}
                            {contact.phone && (
                                <a href={`tel:${contact.phone}`} className="flex items-center text-sm text-gray-600 hover:text-black">
                                    <Phone size={14} className="mr-2 text-gray-400" />
                                    {contact.phone}
                                </a>
                            )}
                            {contact.company && (
                                <div className="flex items-center text-sm text-gray-600">
                                    <span className="text-gray-400 mr-2">Entreprise:</span>
                                    <Link to={`/crm/companies/${contact.company.id}`} className="text-blue-600 hover:underline font-medium">
                                        {contact.company.name}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {filteredContacts.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        Aucun contact trouvé
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactList;
