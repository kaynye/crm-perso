interface PDFGeneratorOptions {
    title: string;
    contentHTML: string;
    metadata?: string;
    filename?: string;
}

export const generatePDF = ({ title, contentHTML, metadata, filename }: PDFGeneratorOptions) => {
    console.log('generatePDF called with contentHTML length:', contentHTML?.length);

    // Create a hidden iframe, but make sure it has dimensions for rendering
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '210mm'; // A4 width
    iframe.style.height = '297mm'; // A4 height
    iframe.style.border = 'none';
    iframe.style.opacity = '0'; // Hide visually but keep it "rendered"
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-1';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
        console.error('Could not get iframe document');
        document.body.removeChild(iframe);
        return;
    }

    // Styles to inject into the isolated iframe
    const styles = `
        @media print {
            @page {  }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; color: #111; line-height: 1.5; }
        .pdf-container {
            padding: 40px; 
            padding-top: 20px; 
            max-width: 800px;
            margin: 0 auto;
        }
        h1 { font-size: 24px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; color: #111; }
        .metadata { color: #666; font-size: 14px; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        
        /* Content Styles */
        h2 { font-size: 20px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; }
        h3 { font-size: 18px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
        p { margin-bottom: 12px; }
        ul, ol { margin-bottom: 16px; padding-left: 24px; }
        li { margin-bottom: 6px; }
        a { color: #2563eb; text-decoration: none; }
        blockquote { border-left: 4px solid #ccc; padding-left: 16px; margin-left: 0; color: #555; font-style: italic; }
        
        /* Table Styles */
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; vertical-align: top; }
        th { background-color: #f9fafb; font-weight: 600; }
        tr:nth-child(even) { background-color: #f9fafb; }
    `;

    // Write content to iframe
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${filename || title}</title>
            <style>${styles}</style>
        </head>
        <body>
            <div class="pdf-container">
                ${title ? `<h1>${title}</h1>` : ''}
                ${metadata ? `<div class="metadata">${metadata}</div>` : ''}
                <div class="content">
                    ${contentHTML}
                </div>
            </div>
            <script>
                // Wait for content (like images) to load if necessary, though simpler is safer for now
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
    doc.close();

    // Clean up after a delay
    // We can't know exactly when printing is done, but removing the iframe immediately prevents printing in some browsers.
    // A long timeout is usually safe enough for the user to initiate the print dialog.
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 60000); // 1 minute timeout cleanup (long enough for the dialog to be interactive)
};
