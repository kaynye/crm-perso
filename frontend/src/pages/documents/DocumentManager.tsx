import React from 'react';
import DocumentList from '../../components/documents/DocumentList';

const DocumentManager: React.FC = () => {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Gestion Documentaire (GED)</h1>
                <p className="mt-2 text-gray-600">Gérez tous vos documents d'entreprise, contrats et fichiers divers.</p>
            </div>

            <DocumentList showFilters={true} />
        </div>
    );
};

export default DocumentManager;
