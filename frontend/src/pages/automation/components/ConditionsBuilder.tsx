import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Condition {
    field: string;
    operator: string;
    value: string;
}

interface ConditionsBuilderProps {
    conditions: Condition[];
    onChange: (conditions: Condition[]) => void;
}

const OPERATORS = [
    { value: 'equals', label: 'Est égal à' },
    { value: 'neq', label: 'Est différent de' },
    { value: 'contains', label: 'Contient' },
    { value: 'gt', label: 'Est supérieur à' },
    { value: 'lt', label: 'Est inférieur à' },
];

const FIELDS = [
    { value: 'status', label: 'Statut' },
    { value: 'priority', label: 'Priorité' },
    { value: 'amount', label: 'Montant' },
    { value: 'title', label: 'Titre' },
];

const ConditionsBuilder: React.FC<ConditionsBuilderProps> = ({ conditions, onChange }) => {
    const addCondition = () => {
        onChange([...conditions, { field: 'status', operator: 'equals', value: '' }]);
    };

    const removeCondition = (index: number) => {
        const newConditions = [...conditions];
        newConditions.splice(index, 1);
        onChange(newConditions);
    };

    const updateCondition = (index: number, key: keyof Condition, value: string) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], [key]: value };
        onChange(newConditions);
    };

    return (
        <div className="space-y-4">
            {conditions.map((condition, index) => (
                <div key={index} className="flex gap-4 items-start bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex-1">
                        <select
                            value={condition.field}
                            onChange={(e) => updateCondition(index, 'field', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                            {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <select
                            value={condition.operator}
                            onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                            {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <input
                            type="text"
                            value={condition.value}
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Valeur"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => removeCondition(index)}
                        className="p-2 text-gray-400 hover:text-red-600 self-center"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}

            <button
                type="button"
                onClick={addCondition}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
                <Plus size={16} />
                Ajouter une condition
            </button>
        </div>
    );
};

export default ConditionsBuilder;
