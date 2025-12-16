import edjsHTML from 'editorjs-html';

// Custom Parsers for EditorJS
const customParsers = {
    table: (block: any) => {
        const rows = block.data.content.map((row: string[], index: number) => {
            const isHeader = block.data.withHeadings && index === 0;
            const cellType = isHeader ? 'th' : 'td';
            const cellClass = isHeader ? 'p-2 text-left font-semibold border border-gray-200 bg-gray-50' : 'p-2 border border-gray-200';
            return `<tr>${row.map(cell => `<${cellType} class="${cellClass}">${cell}</${cellType}>`).join('')}</tr>`;
        }).join('');
        return `<div class="editorjs-table-wrapper mt-2 w-full overflow-x-auto"><table class="w-full border-collapse border border-gray-200 mb-4"><tbody>${rows}</tbody></table></div>`;
    },
    list: (block: any) => {
        const type = block.data.style === 'ordered' ? 'ol' : 'ul';
        const items = block.data.items.map((item: any) => {
            const text = typeof item === 'string' ? item : (item.content || item.text || '');
            return `<li>${text}</li>`;
        }).join('');
        return `<${type}>${items}</${type}>`;
    },
    checklist: (block: any) => {
        const items = block.data.items.map((item: any) =>
            `<div class="checklist-item"><input type="checkbox" ${item.checked ? 'checked' : ''} disabled> <span>${item.text}</span></div>`
        ).join('');
        return `<div class="checklist">${items}</div>`;
    },
    header: (block: any) => {
        const level = block.data.level;
        const headingLevels: Record<number, string> = {
            1: "text-3xl font-bold mb-4 mt-6",
            2: "text-2xl font-bold mb-3 mt-5",
            3: "text-xl font-bold mb-3 mt-4",
            4: "text-lg font-bold mb-2 mt-3",
            5: "text-base font-bold mb-2 mt-2",
            6: "text-sm font-bold mb-1 mt-1",
        };
        const classes = headingLevels[level] || "";
        return `<h${level} class="${classes}">${block.data.text}</h${level}>`;
    },
    delimiter: () => {
        return `<hr class="ce-delimiter" />`;
    },
    // Fallback for unknown blocks to avoid crashes
    image: (block: any) => {
        return `<img src="${block.data.file?.url}" alt="${block.data.caption}" />`;
    }
};

// EditorJS Parser (for viewing)
// @ts-ignore
export const edjsParser = edjsHTML(customParsers);

export const editorStyles = "prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:my-2 prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-gray-200 [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-100 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2";

export { customParsers };

