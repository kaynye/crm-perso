import editorJsHtml from 'editorjs-html';

const tableConfig = {
    // Custom parser for the 'table' block
    table: (block: any) => {
        const rows = block.data.content.map((row: string[], index: number) => {
            if (index === 0 && block.data.withHeadings) {
                return `<tr>${row.map((cell: string) => `<th style="background-color: #f3f4f6; font-weight: bold; text-align: left;">${cell}</th>`).join('')}</tr>`;
            }
            return `<tr>${row.map((cell: string) => `<td>${cell}</td>`).join('')}</tr>`;
        }).join('');
        return `<table border="1" style="width:100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px;">${rows}</table>`;
    },
    // Mentions
    mention: (block: any) => {
        return `<span style="color: #2563eb; background-color: #eff6ff; padding: 2px 4px; border-radius: 4px; font-weight: 500;">@${block.data.label || block.data.name}</span>`;
    },
    // Attachments
    attaches: (block: any) => {
        return `
            <div style="border: 1px solid #ddd; padding: 10px; border-radius: 6px; margin: 10px 0; background-color: #f9fafb;">
                <div style="font-weight: 500; font-size: 14px;">📎 ${block.data.title || block.data.name || 'Fichier joint'}</div>
                <div style="font-size: 12px; color: #666;">${(block.data.size / 1024).toFixed(1)} KB</div>
            </div>
        `;
    },
    // Checkboxes / Checklists
    checklist: (block: any) => {
        const items = block.data.items.map((item: any) => {
            return `<div style="display: flex; align-items: flex-start; margin-bottom: 6px;">
                <span style="display: inline-block; width: 14px; height: 14px; border: 1px solid #ccc; border-radius: 3px; margin-right: 8px; position: relative; top: 3px; background-color: ${item.checked ? '#2563eb' : 'white'}; border-color: ${item.checked ? '#2563eb' : '#ccc'};">
                    ${item.checked ? '<span style="color: white; font-size: 10px; position: absolute; top: -1px; left: 1px;">✓</span>' : ''}
                </span>
                <span style="${item.checked ? 'text-decoration: line-through; color: #888;' : ''}">${item.text}</span>
            </div>`;
        }).join('');
        return `<div style="margin: 10px 0;">${items}</div>`;
    },
    // Database placeholder
    database: (_block: any) => {
        return `<div style="border: 1px dashed #ccc; padding: 10px; color: #666; font-style: italic;">[Base de données liée]</div>`;
    },
    // Delimiter
    delimiter: () => {
        return `<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb; width: 100%;" />`;
    },
    // Page Break
    pageBreak: () => {
        return `<div style="page-break-before: always; break-before: page; height: 1px; margin: 0; border: none;"></div>`;
    },
    // Paragraph - Custom parser to preserve empty lines
    paragraph: (block: any) => {
        if (!block.data.text || block.data.text.trim() === '') {
            return '<p style="margin-bottom: 1em; min-height: 1em;">&nbsp;</p>';
        }
        return `<p>${block.data.text}</p>`;
    }
};



// Initialize the parser with custom configuration safe for Vite/ESM/CJS
let edjsParser: any;
try {
    const parserFactory = typeof editorJsHtml === 'function'
        // @ts-ignore
        ? editorJsHtml
        // @ts-ignore
        : (editorJsHtml as any).default;

    if (typeof parserFactory === 'function') {
        edjsParser = parserFactory(tableConfig);
    } else {
        console.error('Failed to initialize editorjs-html parser factory');
    }
} catch (e) {
    console.error('Error initializing editorjs-html:', e);
}

export const parseEditorJsData = (data: any) => {
    console.log('parseEditorJsData input:', data);
    if (!edjsParser) {
        console.error('Parser not initialized');
        return '<p style="color:red">Error: PDF parser not initialized</p>';
    }

    if (!data || !data.blocks || !Array.isArray(data.blocks)) {
        console.warn('Invalid data passed to parser:', data);
        return '';
    }

    try {
        const html = edjsParser.parse(data);
        console.log('parseEditorJsData output type:', typeof html);
        console.log('parseEditorJsData output length:', html?.length);

        if (Array.isArray(html)) {
            return html.join('');
        }
        if (typeof html === 'string') {
            return html;
        }
        return JSON.stringify(html);
    } catch (error) {
        console.error('Error parsing EditorJS data:', error);
        return '';
    }
};
