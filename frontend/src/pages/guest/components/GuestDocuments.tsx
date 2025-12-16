import React, { useState, useEffect } from 'react';
import { FileText, Download, Plus, X, UploadCloud } from 'lucide-react';
import api from '../../../api/axios';

const DocumentUploadModal: React.FC<{ token: string, onClose: () => void, onSuccess: () => void }> = ({ token, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            if (!title) {
                // Auto-fill title with filename (without extension)
                const name = e.target.files[0].name;
                setTitle(name.substring(0, name.lastIndexOf('.')) || name);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', title);

        try {
            await api.post(`/crm/public/documents/?token=${token}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'upload du document.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">Uploader un Document</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fichier</label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                                    <p className="text-sm text-gray-500"><span className="font-semibold">Cliquez pour upload</span> ou glissez-déposez</p>
                                    <p className="text-xs text-gray-400 mt-1">{file ? file.name : 'PDF, DOC, IMG...'}</p>
                                </div>
                                <input type="file" required className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                            <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Nom du document" />
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={uploading || !file} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                                {uploading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                                {uploading ? 'Upload...' : 'Uploader'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const DocumentPreviewModal: React.FC<{ fileUrl: string, fileName: string, onClose: () => void }> = ({ fileUrl, fileName, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-scale-in">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">{fileName}</h3>
                    <div className="flex items-center gap-2">
                        <a href={fileUrl} download className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Télécharger">
                            <Download size={20} />
                        </a>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X size={20} /></button>
                    </div>
                </div>
                <div className="flex-1 bg-gray-100 p-1 relative">
                    <iframe src={`${fileUrl}?t=${Date.now()}`} className="w-full h-full rounded-md bg-white" title={fileName} />
                </div>
            </div>
        </div>
    );
};

const GuestDocuments: React.FC<{ token: string, canUpload: boolean }> = ({ token, canUpload }) => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<{ url: string, name: string } | null>(null);

    const fetchDocuments = () => {
        setLoading(true);
        api.get(`/crm/public/documents/?token=${token}`)
            .then(res => {
                if (Array.isArray(res.data)) setDocuments(res.data);
                else if (res.data.results) setDocuments(res.data.results);
                else setDocuments([]);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchDocuments();
    }, [token]);

    const handlePreview = (doc: any) => {
        const ext = doc.file.split('.').pop().toLowerCase();
        // Check if previewable
        if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'txt'].includes(ext)) {
            setPreviewDoc({ url: doc.file, name: doc.name });
        } else {
            // Fallback to new tab/download
            window.open(doc.file, '_blank');
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Chargement des documents...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                {canUpload && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                    >
                        <Plus size={16} /> Uploader un document
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map(doc => (
                    <div
                        key={doc.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-4 hover:border-indigo-300 transition-all hover:shadow-md group cursor-pointer"
                        onClick={() => handlePreview(doc)}
                    >
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <FileText size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate" title={doc.name}>{doc.name}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                            <div className="mt-3 flex items-center gap-3">
                                <span className="text-xs text-indigo-600 font-medium group-hover:underline">Prévisualiser</span>
                                <a
                                    href={doc.file}
                                    onClick={(e) => e.stopPropagation()}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                                    title="Télécharger"
                                >
                                    <Download size={16} />
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
                {documents.length === 0 && <div className="col-span-full text-center text-gray-400 py-10">Aucun document trouvé.</div>}
            </div>

            {showModal && <DocumentUploadModal token={token} onClose={() => setShowModal(false)} onSuccess={fetchDocuments} />}
            {previewDoc && <DocumentPreviewModal fileUrl={previewDoc.url} fileName={previewDoc.name} onClose={() => setPreviewDoc(null)} />}
        </div>
    );
};

export default GuestDocuments;
