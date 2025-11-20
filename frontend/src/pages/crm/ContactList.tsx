import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Plus } from 'lucide-react';

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

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
                <button onClick={createContact} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    <Plus size={16} className="mr-2" />
                    New Contact
                </button>
            </div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {contacts.map((contact) => (
                        <li key={contact.id}>
                            <div className="block hover:bg-gray-50">
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-indigo-600 truncate">{contact.first_name} {contact.last_name}</p>
                                        <div className="ml-2 flex-shrink-0 flex">
                                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {contact.position || 'No Position'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                {contact.email}
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

export default ContactList;
