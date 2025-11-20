import React, { useEffect, useRef } from 'react';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';

interface EditorProps {
    data: OutputData;
    onChange: (data: OutputData) => void;
    readOnly?: boolean;
}

const Editor: React.FC<EditorProps> = ({ data, onChange, readOnly = false }) => {
    const ref = useRef<EditorJS | null>(null);
    const holderId = 'editorjs-holder';

    useEffect(() => {
        if (!ref.current) {
            const editor = new EditorJS({
                holder: holderId,
                tools: {
                    header: Header,
                    list: List,
                },
                data: data,
                readOnly: readOnly,
                async onChange(api) {
                    const savedData = await api.saver.save();
                    onChange(savedData);
                },
            });
            ref.current = editor;
        }

        return () => {
            if (ref.current && ref.current.destroy) {
                ref.current.destroy();
                ref.current = null;
            }
        };
    }, []); // Empty dependency array to initialize once. 
    // Note: Updating data prop won't re-render editor to avoid cursor jumps. 
    // Real-time updates need more complex logic.

    return <div id={holderId} className="prose max-w-none" />;
};

export default Editor;
