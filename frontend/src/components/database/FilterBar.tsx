import React, { useState } from 'react';
import { Filter, Plus, X } from 'lucide-react';

interface FilterBarProps {
    properties: any[];
    filters: any[];
    onFilterChange: (filters: any[]) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ properties, filters, onFilterChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const addFilter = () => {
        if (properties.length === 0) return;
        // Default to first property
        const newFilter = { propertyId: properties[0].id, value: '' };
        onFilterChange([...filters, newFilter]);
        setIsOpen(true);
    };

    const removeFilter = (index: number) => {
        const newFilters = [...filters];
        newFilters.splice(index, 1);
        onFilterChange(newFilters);
    };

    const updateFilter = (index: number, key: string, value: any) => {
        const newFilters = [...filters];
        newFilters[index] = { ...newFilters[index], [key]: value };
        onFilterChange(newFilters);
    };

    return (
        <div className="flex items-center space-x-2 mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center px-2 py-1 text-sm rounded hover:bg-gray-100 ${filters.length > 0 ? 'text-blue-600' : 'text-gray-500'}`}
            >
                <Filter size={14} className="mr-1" />
                Filter
                {filters.length > 0 && <span className="ml-1 bg-blue-100 text-blue-600 px-1.5 rounded-full text-xs">{filters.length}</span>}
            </button>

            {isOpen && (
                <div className="flex flex-wrap gap-2 items-center">
                    {filters.map((filter, index) => {
                        const prop = properties.find(p => p.id === filter.propertyId);
                        return (
                            <div key={index} className="flex items-center bg-white border border-gray-200 rounded shadow-sm px-2 py-1 text-sm">
                                <select
                                    value={filter.propertyId}
                                    onChange={(e) => updateFilter(index, 'propertyId', e.target.value)}
                                    className="border-none text-sm p-0 text-gray-700 focus:ring-0 mr-2 cursor-pointer"
                                >
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>

                                <span className="text-gray-400 mr-2">is</span>

                                {prop?.type === 'select' ? (
                                    <select
                                        value={filter.value}
                                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                                        className="border-none text-sm p-0 text-gray-900 focus:ring-0 mr-2 min-w-[80px]"
                                    >
                                        <option value="">Select...</option>
                                        {prop.config?.options?.map((opt: string) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : prop?.type === 'checkbox' ? (
                                    <select
                                        value={filter.value}
                                        onChange={(e) => updateFilter(index, 'value', e.target.value === 'true')}
                                        className="border-none text-sm p-0 text-gray-900 focus:ring-0 mr-2"
                                    >
                                        <option value="true">Checked</option>
                                        <option value="false">Unchecked</option>
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={filter.value}
                                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                                        placeholder="Value..."
                                        className="border-none text-sm p-0 text-gray-900 focus:ring-0 mr-2 min-w-[80px]"
                                    />
                                )}

                                <button onClick={() => removeFilter(index)} className="text-gray-400 hover:text-red-500">
                                    <X size={12} />
                                </button>
                            </div>
                        );
                    })}
                    <button onClick={addFilter} className="flex items-center text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                        <Plus size={12} className="mr-1" /> Add filter
                    </button>
                </div>
            )}
        </div>
    );
};

export default FilterBar;
