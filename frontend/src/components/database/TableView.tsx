import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Plus } from 'lucide-react';

interface TableViewProps {
    database: any;
}

const TableView: React.FC<TableViewProps> = ({ database }) => {
    const [rows, setRows] = useState<any[]>([]);

    useEffect(() => {
        fetchRows();
    }, [database.id]);

    const fetchRows = async () => {
        try {
            const response = await api.get(`/databases/${database.id}/rows/`);
            setRows(response.data);
        } catch (error) {
            console.error("Failed to fetch rows", error);
        }
    };

    const addRow = async () => {
        try {
            await api.post(`/databases/${database.id}/rows/`, { title: 'Untitled' });
            fetchRows();
        } catch (error) {
            console.error("Failed to add row", error);
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64 border-r border-gray-200">
                                Name
                            </th>
                            {database.properties.map((prop: any) => (
                                <th key={prop.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 border-r border-gray-200">
                                    {prop.name}
                                </th>
                            ))}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                                <button onClick={addRow} className="hover:bg-gray-200 p-1 rounded">
                                    <Plus size={14} />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rows.map((row) => (
                            <tr key={row.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                                    <input
                                        type="text"
                                        defaultValue={row.title}
                                        className="w-full border-none focus:ring-0 p-0 text-sm"
                                    />
                                </td>
                                {database.properties.map((prop: any) => {
                                    const val = row.values.find((v: any) => v.property === prop.id);
                                    let displayValue = '-';

                                    if (val) {
                                        if (prop.type === 'select') {
                                            displayValue = val.value; // Just text for now
                                        } else if (prop.type === 'checkbox') {
                                            displayValue = val.value ? '☑' : '☐';
                                        } else {
                                            displayValue = JSON.stringify(val.value);
                                        }
                                    }

                                    return (
                                        <td key={prop.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                                            {displayValue}
                                        </td>
                                    );
                                })}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={database.properties.length + 2} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No rows. Click + to add one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div
                className="bg-gray-50 px-6 py-2 border-t border-gray-200 text-sm text-gray-500 cursor-pointer hover:bg-gray-100 flex items-center"
                onClick={addRow}
            >
                <Plus size={14} className="mr-2" /> New
            </div>
        </div>
    );
};

export default TableView;
