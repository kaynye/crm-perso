import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import TableView from './TableView';
import KanbanView from './KanbanView';
import FilterBar from './FilterBar';
import { Plus, LayoutGrid, Table as TableIcon } from 'lucide-react';

const DatabaseView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [database, setDatabase] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
    const [groupBy, setGroupBy] = useState<string>('');
    const [filters, setFilters] = useState<any[]>([]);

    useEffect(() => {
        fetchDatabase();
    }, [id]);

    const fetchDatabase = async () => {
        try {
            const response = await api.get(`/databases/${id}/`);
            setDatabase(response.data);
            // Default group by first select property if available
            const selectProp = response.data.properties.find((p: any) => p.type === 'select');
            if (selectProp) {
                setGroupBy(selectProp.id);
            }
        } catch (error) {
            console.error("Failed to fetch database", error);
        } finally {
            setLoading(false);
        }
    };

    const addProperty = async () => {
        const name = prompt("Nom de la propriété :");
        const type = prompt("Type de propriété (text, number, select, checkbox, relation) :", "text");

        let config = {};
        if (type === 'select') {
            const optionsStr = prompt("Entrez les options séparées par une virgule (ex: À faire, Fait) :");
            if (optionsStr) {
                config = { options: optionsStr.split(',').map(o => o.trim()) };
            }
        } else if (type === 'relation') {
            const relatedDbId = prompt("Entrez l'ID de la base de données liée :");
            if (relatedDbId) {
                config = { related_database_id: relatedDbId };
            }
        }

        if (name && type) {
            try {
                await api.post(`/databases/${id}/properties/`, { name, type, config });
                fetchDatabase();
            } catch (error) {
                console.error("Failed to add property", error);
            }
        }
    };

    if (loading) return <div className="p-8">Chargement...</div>;
    if (!database) return <div className="p-8">Base de données introuvable</div>;

    const selectProperties = database.properties.filter((p: any) => p.type === 'select');

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-gray-900">{database.title}</h1>
                    <div className="flex bg-gray-100 rounded p-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Vue Tableau"
                        >
                            <TableIcon size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={`p-1.5 rounded ${viewMode === 'board' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Vue Kanban"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                    {viewMode === 'board' && selectProperties.length > 0 && (
                        <div className="flex items-center space-x-2 text-sm">
                            <span className="text-gray-500">Grouper par :</span>
                            <select
                                value={groupBy}
                                onChange={(e) => setGroupBy(e.target.value)}
                                className="border-none bg-gray-100 rounded px-2 py-1 text-gray-700 focus:ring-0 cursor-pointer"
                            >
                                {selectProperties.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div className="flex space-x-2">
                    <button onClick={addProperty} className="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                        <Plus size={14} className="mr-1" />
                        Ajouter une propriété
                    </button>
                </div>
            </div>

            <FilterBar
                properties={database.properties}
                filters={filters}
                onFilterChange={setFilters}
            />

            <div className="flex-1 overflow-auto">
                {viewMode === 'table' && <TableView database={database} filters={filters} />}
                {viewMode === 'board' && (
                    groupBy ? (
                        <KanbanView
                            database={database}
                            groupByProperty={database.properties.find((p: any) => p.id === groupBy)}
                        />
                    ) : (
                        <div className="text-gray-500 text-center mt-10">
                            Ajoutez une propriété 'Select' pour utiliser la vue Kanban.
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default DatabaseView;
