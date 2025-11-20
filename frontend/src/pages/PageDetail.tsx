import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import Editor from '../components/Editor';
import type { OutputData } from '@editorjs/editorjs';

const PageDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [page, setPage] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPage = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const response = await api.get(`/pages/${id}/`);
                setPage(response.data);
            } catch (error) {
                console.error("Failed to fetch page", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    }, [id]);

    const handleSave = async (data: OutputData) => {
        try {
            await api.patch(`/pages/${id}/`, { content: JSON.stringify(data) });
        } catch (error) {
            console.error("Failed to save page", error);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!page) return <div className="p-8">Page not found</div>;

    let contentData: OutputData = { blocks: [] };
    try {
        const parsed = JSON.parse(page.content || '{}');
        if (parsed.blocks) {
            contentData = parsed;
        }
    } catch (e) {
        console.error("Failed to parse content", e);
    }

    return (
        <div className="max-w-4xl mx-auto p-12">
            <input
                className="text-4xl font-bold mb-8 text-gray-900 w-full border-none focus:outline-none focus:ring-0 placeholder-gray-300"
                value={page.title}
                onChange={(e) => setPage({ ...page, title: e.target.value })}
                onBlur={() => api.patch(`/pages/${id}/`, { title: page.title })}
            />
            <div className="min-h-[500px]">
                <Editor data={contentData} onChange={handleSave} />
            </div>
        </div>
    );
};

export default PageDetail;
