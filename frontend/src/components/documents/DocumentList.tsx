import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { File, Upload, Trash2, Download, Eye, X } from 'lucide-react';

interface Document {
    id: string;
    name: string;
    file: string;
    uploaded_at: string;
    company_name?: string;
    contract_title?: string;
}

interface DocumentListProps {
    companyId?: string;
    contractId?: string;
    showFilters?: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({ companyId, contractId, showFilters = false }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadName, setUploadName] = useState('');
    const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

    useEffect(() => {
        fetchDocuments();
    }, [companyId, contractId]);

    const fetchDocuments = async () => {
        try {
            let url = '/crm/documents/';
            const params = new URLSearchParams();
            if (companyId) params.append('company', companyId);
            if (contractId) params.append('contract', contractId);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await api.get(url);
            if (Array.isArray(response.data)) {
                setDocuments(response.data);
            } else if (response.data.results && Array.isArray(response.data.results)) {
                setDocuments(response.data.results);
            } else {
                setDocuments([]);
            }
        } catch (error) {
            console.error("Failed to fetch documents", error);
            setDocuments([]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !uploadName) return;

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('name', uploadName);
        if (companyId) formData.append('company', companyId);
        if (contractId) formData.append('contract', contractId);

        try {
            setIsUploading(true);
            await api.post('/crm/documents/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setUploadFile(null);
            setUploadName('');
            fetchDocuments();
        } catch (error) {
            console.error("Failed to upload document", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;
        try {
            await api.delete(`/crm/documents/${id}/`);
            fetchDocuments();
        } catch (error) {
            console.error("Failed to delete document", error);
        }
    };

    const isImage = (filename: string) => {
        return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(filename);
    };

    const isPDF = (filename: string) => {
        return /\.pdf(\?.*)?$/i.test(filename);
    };

    return (
        <div className="space-y-6">
            {/* ... existing upload section ... */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Upload size={16} className="mr-2" />
                    Ajouter un document
                </h3>
                <form onSubmit={handleUpload} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Nom du document"
                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={uploadName}
                            onChange={(e) => setUploadName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <input
                            type="file"
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            onChange={(e) => {
                                const file = e.target.files ? e.target.files[0] : null;
                                setUploadFile(file);
                                if (file && !uploadName) {
                                    setUploadName(file.name.split('.').slice(0, -1).join('.'));
                                }
                            }}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isUploading}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isUploading ? 'Envoi...' : 'Uploader'}
                    </button>
                </form>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            {showFilters && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lié à</th>}
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {documents.map((doc) => (
                            <tr key={doc.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <File className="h-5 w-5 text-gray-400 mr-3" />
                                        <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(doc.uploaded_at).toLocaleDateString()}
                                </td>
                                {showFilters && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {doc.company_name && <span className="mr-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{doc.company_name}</span>}
                                        {doc.contract_title && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{doc.contract_title}</span>}
                                    </td>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => setPreviewDoc(doc)}
                                        className="text-gray-500 hover:text-indigo-600 mr-4"
                                        title="Prévisualiser"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <a href={doc.file} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 mr-4" title="Télécharger">
                                        <Download size={18} />
                                    </a>
                                    <button onClick={() => handleDelete(doc.id)} className="text-red-600 hover:text-red-900" title="Supprimer">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {documents.length === 0 && (
                            <tr>
                                <td colSpan={showFilters ? 4 : 3} className="px-6 py-4 text-center text-sm text-gray-500">
                                    Aucun document trouvé.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewDoc(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-gray-200">
                            <h3 className="font-bold text-gray-900">{previewDoc.name}</h3>
                            <div className="flex items-center gap-2">
                                <a
                                    href={previewDoc.file}
                                    download
                                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full"
                                    title="Télécharger"
                                >
                                    <Download size={20} />
                                </a>
                                <button
                                    onClick={() => setPreviewDoc(null)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-100 overflow-hidden flex items-center justify-center p-4 relative">
                            {isImage(previewDoc.file) ? (
                                <img
                                    src={previewDoc.file}
                                    alt={previewDoc.name}
                                    className="max-w-full max-h-full object-contain shadow-lg rounded"
                                />
                            ) : isPDF(previewDoc.file) ? (
                                <iframe
                                    src={previewDoc.file}
                                    className="w-full h-full rounded shadow-sm bg-white"
                                    title={previewDoc.name}
                                />
                            ) : (
                                <div className="text-center">
                                    <File size={64} className="mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-600 mb-4">Aperçu non disponible pour ce type de fichier.</p>
                                    <a
                                        href={previewDoc.file}
                                        download
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                    >
                                        <Download size={16} className="mr-2" />
                                        Télécharger le fichier
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentList;
