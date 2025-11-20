import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import TableView from './TableView';
import { Plus } from 'lucide-react';

const DatabaseView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [database, setDatabase] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDatabase();
    }, [id]);

    const fetchDatabase = async () => {
        try {
            const response = await api.get(`/databases/${id}/`);
            setDatabase(response.data);
        } catch (error) {
            console.error("Failed to fetch database", error);
        } finally {
            setLoading(false);
        }
    };

    const addProperty = async () => {
        const name = prompt("Property Name:");
        const type = prompt("Property Type (text, number, select, checkbox):", "text");
        if (name && type) {
            try {
                await api.post(`/databases/${id}/properties/`, { name, type });
                fetchDatabase();
            } catch (error) {
                console.error("Failed to add property", error);
            }
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!database) return <div className="p-8">Database not found</div>;

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{database.title}</h1>
                <div className="flex space-x-2">
                    <button onClick={addProperty} className="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                        <Plus size={14} className="mr-1" />
                        Add Property
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {database.view_type === 'table' && <TableView database={database} />}
                {database.view_type !== 'table' && <div>View type not supported yet</div>}
            </div>
        </div>
    );
};

export default DatabaseView;
