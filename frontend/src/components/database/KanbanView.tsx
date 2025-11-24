import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Plus } from 'lucide-react';

interface KanbanViewProps {
    database: any;
    groupByProperty: any;
}

const KanbanView: React.FC<KanbanViewProps> = ({ database, groupByProperty }) => {
    const [columns, setColumns] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchKanbanData();
    }, [database.id, groupByProperty.id]);

    const fetchKanbanData = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/databases/${database.id}/kanban/?group_by=${groupByProperty.id}`);
            setColumns(response.data);
        } catch (error) {
            console.error("Failed to fetch kanban data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, rowId: string) => {
        e.dataTransfer.setData('rowId', rowId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault();
        const rowId = e.dataTransfer.getData('rowId');

        // Optimistic update
        const newColumns = { ...columns };
        let movedRow: any = null;

        // Find and remove row from old column
        Object.keys(newColumns).forEach(status => {
            const index = newColumns[status].findIndex(r => r.id === rowId);
            if (index !== -1) {
                movedRow = newColumns[status][index];
                newColumns[status].splice(index, 1);
            }
        });

        if (movedRow) {
            // Add to new column
            if (!newColumns[targetStatus]) newColumns[targetStatus] = [];
            newColumns[targetStatus].push(movedRow);
            setColumns(newColumns);

            // API Call to update value
            try {
                // We need to update the specific property value for this row
                // Since we don't have a direct endpoint for "update property value X for row Y" easily exposed yet
                // We can use the row update endpoint if we had one, or create a specific one.
                // Wait, we don't have a Row Update endpoint in views.py yet!
                // We only have 'rows' (GET/POST).
                // We need to implement a way to update a row's value.

                // WORKAROUND: For now, let's assume we can POST to /databases/:id/rows/ with the same ID? No, that creates new.
                // We need to update the PropertyValue directly.
                // We have PropertyValueViewSet at /api/values/.

                // 1. Find the PropertyValue ID for this row and property
                // This is hard without fetching it first.
                // Actually, let's look at how we can update.
                // We can use the `values` endpoint if we know the ID.
                // But we don't know the PropertyValue ID easily here.

                // Alternative: Implement a helper endpoint or use a smart update.
                // Let's try to find the value in the row data.

                // Wait, serializer uses property_name/type but we need ID to find it in the list?
                // RowSerializer: values = PropertyValueSerializer(many=True)
                // PropertyValueSerializer: id, page, property, value...

                const existingVal = movedRow.values.find((v: any) => v.property === groupByProperty.id);

                if (existingVal) {
                    await api.patch(`/values/${existingVal.id}/`, { value: targetStatus });
                } else {
                    // Create new value
                    await api.post(`/values/`, {
                        page: rowId,
                        property: groupByProperty.id,
                        value: targetStatus
                    });
                }

                // Refetch to be sure
                fetchKanbanData();

            } catch (error) {
                console.error("Failed to update status", error);
                fetchKanbanData(); // Revert on error
            }
        }
    };

    if (loading) return <div className="p-4">Chargement du tableau...</div>;

    return (
        <div className="flex h-full overflow-x-auto p-4 space-x-4">
            {Object.keys(columns).map(status => (
                <div
                    key={status}
                    className="min-w-[280px] w-[280px] flex flex-col bg-gray-50 rounded-lg border border-gray-200 max-h-full"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                >
                    <div className="p-3 font-semibold text-gray-700 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-lg">
                        <span>{status}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{columns[status].length}</span>
                    </div>
                    <div className="p-2 flex-1 overflow-y-auto space-y-2">
                        {columns[status].map(row => (
                            <div
                                key={row.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, row.id)}
                                className="bg-white p-3 rounded shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                            >
                                <div className="font-medium text-gray-800 mb-1">{row.title}</div>
                                {/* Show other properties? For now just title */}
                            </div>
                        ))}
                        <button className="w-full py-1.5 text-sm text-gray-500 hover:bg-gray-200 rounded flex items-center justify-center">
                            <Plus size={14} className="mr-1" /> Nouveau
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KanbanView;
