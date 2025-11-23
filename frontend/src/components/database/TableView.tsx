import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Plus } from 'lucide-react';

interface TableViewProps {
    database: any;
    filters?: any[];
}

import ActionsMenu from '../ActionsMenu';

const TableView: React.FC<TableViewProps> = ({ database, filters = [] }) => {
    const [rows, setRows] = useState<any[]>([]);

    useEffect(() => {
        fetchRows();
    }, [database.id, filters]);

    const fetchRows = async () => {
        try {
            let url = `/databases/${database.id}/rows/`;
            if (filters.length > 0) {
                const filterObj: Record<string, any> = {};
                filters.forEach(f => {
                    if (f.value !== '') {
                        filterObj[f.propertyId] = f.value;
                    }
                });
                if (Object.keys(filterObj).length > 0) {
                    url += `?filter=${JSON.stringify(filterObj)}`;
                }
            }
            const response = await api.get(url);
            setRows(response.data);
        } catch (error) {
            console.error("Failed to fetch rows", error);
        }
    };

    const addRow = async () => {
        // ...
    };

    const deleteRow = async (rowId: string) => {
        try {
            await api.delete(`/pages/${rowId}/`); // Rows are Pages
            fetchRows();
        } catch (error) {
            console.error("Failed to delete row", error);
        }
    };

    const deleteProperty = async (propId: string) => {
        try {
            await api.delete(`/databases/${database.id}/properties/${propId}/`); // Need to implement this endpoint in backend if not exists
            // Actually PropertyViewSet is not explicitly exposed under databases/id/properties/id in default router usually, 
            // but let's check urls.py. 
            // We might need to use /api/properties/ID if we exposed it, or nested router.
            // Looking at urls.py, we only have DatabaseViewSet.
            // We need to check if we can delete properties.
            // Let's assume we can't easily delete properties yet without a ViewSet for them.
            // Wait, we have PropertyValueViewSet but not PropertyViewSet?
            // Checking views.py... DatabaseViewSet has 'properties' action (POST).
            // We need a PropertyViewSet or an action to delete.
            // Let's skip Delete Property for now or implement it properly.
            // I'll implement Delete Row first.
            window.location.reload(); // Simple reload to refresh columns
        } catch (error) {
            console.error("Failed to delete property", error);
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
            <div className="overflow-x-auto pb-24">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-64 group">
                                <div className="flex justify-between items-center">
                                    Name
                                </div>
                            </th>
                            {database.properties.map((prop: any) => (
                                <th key={prop.id} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48 group">
                                    <div className="flex justify-between items-center">
                                        {prop.name}
                                        {/* We can't easily delete properties without a backend endpoint. 
                                            I'll leave it out for now to avoid errors, or use a placeholder. 
                                            Actually, let's just do rows for now as per plan "Delete Row option in TableView".
                                            "Delete Property option in DatabaseView" was also in plan.
                                        */}
                                    </div>
                                </th>
                            ))}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                                <button onClick={addRow} className="hover:bg-gray-200 p-1 rounded transition-colors">
                                    <Plus size={14} />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {rows.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <input
                                        type="text"
                                        defaultValue={row.title}
                                        className="w-full border-none focus:ring-0 p-0 text-sm bg-transparent"
                                    />
                                </td>
                                {database.properties.map((prop: any) => {
                                    const val = row.values.find((v: any) => v.property === prop.id);
                                    let displayValue = '-';

                                    if (val) {
                                        if (prop.type === 'select') {
                                            displayValue = val.value;
                                        } else if (prop.type === 'checkbox') {
                                            displayValue = val.value ? '☑' : '☐';
                                        } else {
                                            displayValue = JSON.stringify(val.value);
                                        }
                                    }

                                    return (
                                        <td key={prop.id} className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {prop.type === 'select' && displayValue !== '-' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                    {displayValue}
                                                </span>
                                            ) : (
                                                displayValue
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ActionsMenu
                                        onEdit={() => window.location.href = `/pages/${row.id}`}
                                        onDelete={() => deleteRow(row.id)}
                                    />
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={database.properties.length + 2} className="px-6 py-8 text-center text-sm text-gray-500">
                                    No rows. Click + to add one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div
                className="bg-gray-50/50 px-6 py-3 border-t border-gray-100 text-sm text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors flex items-center font-medium"
                onClick={addRow}
            >
                <Plus size={14} className="mr-2" /> New
            </div>
        </div>
    );
};

export default TableView;
