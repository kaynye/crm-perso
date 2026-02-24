import { useMemo } from 'react';

export const defaultVocabulary = {
    contact: 'Contact',
    contact_plural: 'Contacts',
    contract: 'Contrat',
    contract_plural: 'Contrats',
    meeting: 'Réunion',
    meeting_plural: 'Réunions',
    document: 'Document',
    document_plural: 'Documents',
    task: 'Tâche',
    task_plural: 'Tâches',
    member: 'Membre',
    member_plural: 'Membres',
};

export const useSpaceVocabulary = (space: any) => {
    return useMemo(() => {
        const customVocab = space?.type_details?.vocabulary || {};
        // Merge default vocabulary with custom one
        return {
            ...defaultVocabulary,
            ...customVocab
        };
    }, [space]);
};
