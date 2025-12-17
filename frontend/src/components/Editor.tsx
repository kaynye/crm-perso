import React, { useEffect, useRef, useState } from 'react';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import MentionTool from './editor-tools/MentionTool';
import DatabaseTool from './editor-tools/DatabaseTool';
import MentionModal from './MentionModal';
import AttachesTool from './editor-tools/AttachesTool';
import Delimiter from '@editorjs/delimiter';
import Checklist from '@editorjs/checklist';

import Table from '@editorjs/table';
import { useNavigate } from 'react-router-dom';

interface EditorProps {
    data: OutputData;
    onChange: (data: OutputData) => void;
    readOnly?: boolean;
    holderId?: string;
}

const Editor: React.FC<EditorProps> = ({ data, onChange, readOnly = false, holderId = 'editorjs-holder' }) => {
    const ref = useRef<EditorJS | null>(null);
    const [isMentionModalOpen, setIsMentionModalOpen] = useState(false);
    const [savedRange, setSavedRange] = useState<Range | null>(null);
    const [popover, setPopover] = useState<{ x: number; y: number; url: string; label: string } | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (ref.current && typeof ref.current.readOnly?.toggle === 'function') {
            ref.current.readOnly.toggle(readOnly);
        }
    }, [readOnly]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popover && !(e.target as HTMLElement).closest('.mention-popover')) {
                setPopover(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [popover]);

    const initializedData = useRef<OutputData | null>(data);

    const lastEmittedData = useRef<OutputData | null>(null);

    useEffect(() => {
        if (!ref.current) {
            const editor = new EditorJS({
                holder: holderId,
                tools: {
                    header: {
                        class: Header as any,
                        config: {
                            placeholder: 'Titre',
                            levels: [1, 2, 3],
                            defaultLevel: 1
                        },
                        inlineToolbar: true
                    },
                    list: {
                        class: List,
                        inlineToolbar: true,
                        config: {
                            defaultStyle: 'unordered'
                        }
                    },
                    checklist: {
                        class: Checklist,
                        inlineToolbar: true
                    },
                    delimiter: Delimiter,
                    mention: {
                        class: MentionTool as any,
                        config: {
                            onMentionRequest: (range: Range) => {
                                setSavedRange(range);
                                setIsMentionModalOpen(true);
                            }
                        }
                    },
                    database: DatabaseTool,
                    attaches: AttachesTool,
                    table: {
                        class: Table as any,
                        inlineToolbar: true,
                        config: {
                            rows: 2,
                            cols: 3,
                            withHeadings: true,
                        }
                    },
                },
                data: data,
                readOnly: readOnly,
                async onChange(api) {
                    const savedData = await api.saver.save();
                    lastEmittedData.current = savedData;
                    onChange(savedData);
                },
            });
            ref.current = editor;
            initializedData.current = data;
        }

        return () => {
            if (ref.current && ref.current.destroy) {
                ref.current.destroy();
                ref.current = null;
            }
        };
    }, []); // Empty dependency array to initialize once.

    // Update editor data when prop changes
    useEffect(() => {
        if (ref.current && data && data.blocks && data.blocks.length > 0) {
            // If the data is the same as what we initialized with, don't re-render
            if (data === initializedData.current) {
                return;
            }
            // If the data is the same as what we just emitted, don't re-render
            if (data === lastEmittedData.current) {
                return;
            }

            ref.current.isReady.then(() => {
                // Only render if the data is different to avoid cursor jumps/loops
                // But for templates, we want to force it.
                // Since we don't update 'data' prop on every keystroke in parent, this is safe.
                try {
                    ref.current?.render(data);
                } catch (e) {
                    console.error("Editor render error", e);
                }
            });
        }
    }, [data]);

    const handleEditorClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');

        if (link && link.classList.contains('mention-link')) {
            e.preventDefault();
            e.stopPropagation();
            const href = link.getAttribute('href');
            const rect = link.getBoundingClientRect();

            if (href) {
                setPopover({
                    x: rect.left + window.scrollX,
                    y: rect.bottom + window.scrollY,
                    url: href,
                    label: link.innerText
                });
            }
        }
    };

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
            <div id={holderId} className="prose max-w-none" onClick={handleEditorClick} />
            <MentionModal
                isOpen={isMentionModalOpen}
                onClose={() => setIsMentionModalOpen(false)}
                onSelect={handleMentionSelect}
            />
            {popover && (
                <div
                    className="fixed z-[100] bg-white shadow-xl border border-gray-200 rounded-lg p-2 flex items-center gap-2 mention-popover animate-scale-in"
                    style={{ top: popover.y + 5, left: popover.x }}
                >
                    <button
                        onClick={() => {
                            navigate(popover.url);
                            setPopover(null);
                        }}
                        className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md font-medium flex items-center gap-2 transition-colors"
                    >
                        Open {popover.label}
                    </button>
                    <div className="h-4 w-px bg-gray-200 mx-1" />
                    <button
                        onClick={() => setPopover(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            )}
        </>
    );
};

export default Editor;
