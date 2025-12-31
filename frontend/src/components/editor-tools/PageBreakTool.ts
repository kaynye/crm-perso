
export default class PageBreak {
    static get toolbox() {
        return {
            title: 'Saut de page',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-scissors"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>'
        };
    }

    render() {
        const div = document.createElement('div');
        div.className = 'ce-block__content page-break-marker';
        div.contentEditable = 'false';

        // Visual representation in Editor
        div.style.marginTop = '30px';
        div.style.marginBottom = '30px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.color = '#9ca3af';
        div.style.fontSize = '11px';
        div.style.textTransform = 'uppercase';
        div.style.letterSpacing = '1px';
        div.style.fontFamily = 'monospace';

        div.innerHTML = `
            <div style="flex: 1; border-bottom: 2px dashed #e5e7eb;"></div>
            <div style="margin: 0 15px; color: #6b7280; font-weight: 600;">⚠️ SAUT DE PAGE</div>
            <div style="flex: 1; border-bottom: 2px dashed #e5e7eb;"></div>
        `;

        return div;
    }

    save() {
        return {};
    }
}
