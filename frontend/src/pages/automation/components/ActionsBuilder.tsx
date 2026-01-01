import React from 'react';
import { Trash2, Mail, CheckSquare, Info, Edit3 } from 'lucide-react';

interface Action {
    type: string;
    config: any;
}

interface ActionsBuilderProps {
    actions: Action[];
    onChange: (actions: Action[]) => void;
    users: any[];
    triggerModel: string;
}

const ACTION_TYPES = [
    { value: 'send_email', label: 'Envoyer un email', icon: Mail },
    { value: 'create_task', label: 'Créer une tâche', icon: CheckSquare },
    { value: 'update_field', label: 'Mettre à jour un champ', icon: Edit3 },
];

const VARIABLES_BY_MODEL: Record<string, { label: string, value: string }[]> = {
    'task': [
        { label: 'Titre', value: '{{ instance.title }}' },
        { label: 'Assigné à', value: '{{ instance.assigned_to }}' },
        { label: 'Entreprise', value: '{{ instance.company }}' },
    ],
    'contract': [
        { label: 'Titre', value: '{{ instance.title }}' },
        { label: 'Statut', value: '{{ instance.status }}' },
        { label: 'Montant', value: '{{ instance.amount }}' },
        { label: 'Date début', value: '{{ instance.start_date }}' },
        { label: 'Date fin', value: '{{ instance.end_date }}' },
    ],
    'meeting': [
        { label: 'Titre', value: '{{ instance.title }}' },
        { label: 'Date', value: '{{ instance.date }}' },
        { label: 'Type', value: '{{ instance.type }}' },
    ]
};

const FIELDS_BY_MODEL: Record<string, { label: string, value: string, type?: 'text' | 'select' | 'number' | 'date', options?: { label: string, value: string }[], placeholder?: string }[]> = {
    'task': [
        {
            label: 'Statut',
            value: 'status',
            type: 'select',
            options: [
                { label: 'À faire', value: 'todo' },
                { label: 'En cours', value: 'in_progress' },
                { label: 'Terminé', value: 'done' }
            ]
        },
        {
            label: 'Priorité',
            value: 'priority',
            type: 'select',
            options: [
                { label: 'Basse', value: 'low' },
                { label: 'Moyenne', value: 'medium' },
                { label: 'Haute', value: 'high' }
            ]
        },
    ],
    'contract': [
        {
            label: 'Statut',
            value: 'status',
            type: 'select',
            options: [
                { label: 'Brouillon', value: 'draft' },
                { label: 'Actif', value: 'active' },
                { label: 'Signé', value: 'signed' },
                { label: 'Terminé', value: 'finished' }
            ]
        },
        { label: 'Montant', value: 'amount', type: 'number', placeholder: '1000.00' },
    ],
    'meeting': [
        {
            label: 'Type',
            value: 'type',
            type: 'select',
            options: [
                { label: 'Téléphone', value: 'phone' },
                { label: 'Présentiel', value: 'in_person' },
                { label: 'Vidéo', value: 'video' }
            ]
        },
    ],
};

const COMMON_VARIABLES = [
    { label: 'Auteur (Nom)', value: '{{ actor.last_name }}' },
    { label: 'Auteur (Prénom)', value: '{{ actor.first_name }}' },
    { label: 'Auteur (Email)', value: '{{ actor.email }}' },
];

const VARIABLE_COLORS = {
    common: 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100',
    model: 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
};

const ActionsBuilder: React.FC<ActionsBuilderProps> = ({ actions, onChange, users, triggerModel }) => {
    const addAction = (type: string) => {
        onChange([...actions, { type, config: {} }]);
    };

    const removeAction = (index: number) => {
        const newActions = [...actions];
        newActions.splice(index, 1);
        onChange(newActions);
    };

    const updateActionConfig = (index: number, key: string, value: any) => {
        const newActions = [...actions];
        newActions[index] = {
            ...newActions[index],
            config: { ...newActions[index].config, [key]: value }
        };
        onChange(newActions);
    };

    const insertVariable = (index: number, field: string, variable: string) => {
        const currentVal = actions[index].config[field] || '';
        updateActionConfig(index, field, currentVal + ' ' + variable);
    };

    const VariableHelper = ({ index, field }: { index: number, field: string }) => {
        const modelVars = VARIABLES_BY_MODEL[triggerModel] || [];

        return (
            <div className="mt-1 flex flex-wrap gap-1">
                <span className="text-xs text-gray-500 mr-1 flex items-center"><Info size={10} className="mr-1" /> Variables:</span>

                {COMMON_VARIABLES.map(v => (
                    <button
                        key={v.value}
                        type="button"
                        onClick={() => insertVariable(index, field, v.value)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${VARIABLE_COLORS.common}`}
                        title="Variable d'auteur"
                    >
                        {v.label}
                    </button>
                ))}

                {modelVars.map(v => (
                    <button
                        key={v.value}
                        type="button"
                        onClick={() => insertVariable(index, field, v.value)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${VARIABLE_COLORS.model}`}
                        title="Variable du modèle"
                    >
                        {v.label}
                    </button>
                ))}
            </div>
        );
    };

    // Helper to get field definition
    const getFieldDef = (model: string, fieldName: string) => {
        return FIELDS_BY_MODEL[model]?.find(f => f.value === fieldName);
    };

    return (
        <div className="space-y-6">
            {actions.map((action, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 font-medium text-gray-900">
                            {action.type === 'send_email' ? <Mail size={16} /> : action.type === 'create_task' ? <CheckSquare size={16} /> : <Edit3 size={16} />}
                            {ACTION_TYPES.find(t => t.value === action.type)?.label}
                        </div>
                        <button
                            type="button"
                            onClick={() => removeAction(index)}
                            className="text-gray-400 hover:text-red-600"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                        {action.type === 'send_email' && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Destinataire</label>
                                    <select
                                        value={action.config.recipient_id || ''}
                                        onChange={(e) => updateActionConfig(index, 'recipient_id', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                    >
                                        <option value="">Sélectionner...</option>
                                        <option value="__actor__" className="font-semibold text-indigo-600 bg-indigo-50">⚡️ L'auteur de l'action</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.first_name} {u.email}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Sujet</label>
                                    <input
                                        type="text"
                                        value={action.config.subject || ''}
                                        onChange={(e) => updateActionConfig(index, 'subject', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                                        placeholder="Sujet de l'email"
                                    />
                                    <VariableHelper index={index} field="subject" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Message</label>
                                    <textarea
                                        value={action.config.message || ''}
                                        onChange={(e) => updateActionConfig(index, 'message', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                                        placeholder="Message de l'email..."
                                        rows={3}
                                    />
                                    <VariableHelper index={index} field="message" />
                                </div>
                            </>
                        )}

                        {action.type === 'create_task' && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Assigner à</label>
                                    <select
                                        value={action.config.assigned_to_id || ''}
                                        onChange={(e) => updateActionConfig(index, 'assigned_to_id', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                    >
                                        <option value="">Sélectionner...</option>
                                        <option value="__actor__" className="font-semibold text-indigo-600 bg-indigo-50">⚡️ L'auteur de l'action</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Titre</label>
                                    <input
                                        type="text"
                                        value={action.config.title || ''}
                                        onChange={(e) => updateActionConfig(index, 'title', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                                        placeholder="Titre de la tâche"
                                    />
                                    <VariableHelper index={index} field="title" />
                                </div>
                            </>
                        )}

                        {action.type === 'update_field' && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Champ à modifier</label>
                                    <select
                                        value={action.config.field || ''}
                                        onChange={(e) => {
                                            const newActions = [...actions];
                                            newActions[index] = {
                                                ...newActions[index],
                                                config: {
                                                    ...newActions[index].config,
                                                    field: e.target.value,
                                                    value: '' // Reset value when field changes
                                                }
                                            };
                                            onChange(newActions);
                                        }}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                    >
                                        <option value="">Sélectionner...</option>
                                        {(FIELDS_BY_MODEL[triggerModel] || []).map(f => (
                                            <option key={f.value} value={f.value}>{f.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Nouvelle valeur</label>

                                    {/* Dynamic Input Rendering */}
                                    {(() => {
                                        const fieldDef = getFieldDef(triggerModel, action.config.field);

                                        if (fieldDef?.type === 'select' && fieldDef.options) {
                                            return (
                                                <select
                                                    value={action.config.value || ''}
                                                    onChange={(e) => updateActionConfig(index, 'value', e.target.value)}
                                                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                                >
                                                    <option value="">Sélectionner une option...</option>
                                                    {fieldDef.options.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            );
                                        }

                                        return (
                                            <input
                                                type={fieldDef?.type || 'text'}
                                                value={action.config.value || ''}
                                                onChange={(e) => updateActionConfig(index, 'value', e.target.value)}
                                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                                                placeholder={fieldDef?.placeholder || 'Valeur...'}
                                            />
                                        );
                                    })()}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ))}

            <div className="flex gap-2">
                {ACTION_TYPES.map(type => (
                    <button
                        key={type.value}
                        type="button"
                        onClick={() => addAction(type.value)}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 shadow-sm"
                    >
                        <type.icon size={16} />
                        {type.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ActionsBuilder;
