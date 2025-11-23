import React, { useEffect, useRef, useState } from 'react';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import MentionTool from './editor-tools/MentionTool';
import DatabaseTool from './editor-tools/DatabaseTool';
import MentionModal from './MentionModal';

interface EditorProps {
    data: OutputData;
    onChange: (data: OutputData) => void;
    readOnly?: boolean;
}

const Editor: React.FC<EditorProps> = ({ data, onChange, readOnly = false }) => {
    const ref = useRef<EditorJS | null>(null);
    const holderId = 'editorjs-holder';
    const [isMentionModalOpen, setIsMentionModalOpen] = useState(false);
    const [savedRange, setSavedRange] = useState<Range | null>(null);

    useEffect(() => {
        if (!ref.current) {
            const editor = new EditorJS({
                holder: holderId,
                tools: {
                    header: Header,
                    list: List,
                    mention: {
                        class: MentionTool,
                        config: {
                            onMentionRequest: (range: Range) => {
                                setSavedRange(range);
                                setIsMentionModalOpen(true);
                            }
                        }
                    },
                    database: DatabaseTool,
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

    const handleMentionSelect = (item: any) => {
        if (savedRange) {
            const link = document.createElement('a');
            link.href = item.url;
            link.innerText = `@${item.label}`;
            link.dataset.id = item.id;
            link.dataset.type = item.type;
            link.classList.add('mention-link', 'text-blue-600', 'bg-blue-50', 'px-1', 'rounded', 'no-underline');

            savedRange.deleteContents();
            savedRange.insertNode(link);

            // Optional: Move cursor after the link
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                const newRange = document.createRange();
                newRange.setStartAfter(link);
                newRange.collapse(true);
                selection.addRange(newRange);
            }

            // Trigger save
            ref.current?.save().then((savedData) => {
                onChange(savedData);
            });
        }
        setIsMentionModalOpen(false);
        setSavedRange(null);
    };

    return (
        <>
            <div id={holderId} className="prose max-w-none" />
            <MentionModal
                isOpen={isMentionModalOpen}
                onClose={() => setIsMentionModalOpen(false)}
                onSelect={handleMentionSelect}
            />
        </>
    );
};

export default Editor;
