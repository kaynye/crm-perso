import type { API, BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs';

interface DatabaseToolData {
    databaseId: string;
    title?: string;
}

export default class DatabaseTool implements BlockTool {
    api: API;
    data: DatabaseToolData;
    wrapper: HTMLElement | undefined;

    static get toolbox() {
        return {
            title: 'Database',
            icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>'
        };
    }

    constructor({ api, data }: BlockToolConstructorOptions) {
        this.api = api;
        this.data = data as DatabaseToolData;
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.classList.add('cdx-block');

        if (this.data && this.data.databaseId) {
            this._renderView();
        } else {
            this._renderInput();
        }

        return this.wrapper;
    }

    _renderInput() {
        if (!this.wrapper) return;
        this.wrapper.innerHTML = '';

        const input = document.createElement('input');
        input.placeholder = 'Enter Database ID...';
        input.classList.add('cdx-input');
        input.style.width = '100%';

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value;
                if (value) {
                    this.data = { databaseId: value, title: 'Loading...' };
                    this._renderView();
                }
            }
        });

        this.wrapper.appendChild(input);
    }

    _renderView() {
        if (!this.wrapper) return;
        this.wrapper.innerHTML = '';

        const container = document.createElement('div');
        container.style.border = '1px solid #e2e8f0';
        container.style.borderRadius = '6px';
        container.style.padding = '12px';
        container.style.backgroundColor = '#f8fafc';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.cursor = 'pointer';
        container.style.transition = 'all 0.2s';

        container.addEventListener('mouseenter', () => {
            container.style.borderColor = '#cbd5e1';
            container.style.backgroundColor = '#f1f5f9';
        });
        container.addEventListener('mouseleave', () => {
            container.style.borderColor = '#e2e8f0';
            container.style.backgroundColor = '#f8fafc';
        });

        // Icon
        const icon = document.createElement('div');
        icon.innerHTML = DatabaseTool.toolbox.icon;
        icon.style.marginRight = '12px';
        icon.style.color = '#64748b';

        // Content
        const content = document.createElement('div');
        const title = document.createElement('div');
        title.innerText = this.data.title || 'Database';
        title.style.fontWeight = '500';
        title.style.color = '#334155';

        const subtitle = document.createElement('div');
        subtitle.innerText = 'Click to open database';
        subtitle.style.fontSize = '12px';
        subtitle.style.color = '#94a3b8';

        content.appendChild(title);
        content.appendChild(subtitle);

        container.appendChild(icon);
        container.appendChild(content);

        // Click handler - Navigate to database
        container.addEventListener('click', () => {
            // We can't use React Router here easily, so we'll use window.location or a custom event
            // Using window.location causes full reload which is not ideal but works for MVP
            // Better: Dispatch custom event that React listens to?
            // Or just use window.location.href = ...
            window.location.href = `/databases/${this.data.databaseId}`;
        });

        this.wrapper.appendChild(container);

        // Fetch title if needed (optional for MVP, can just show ID or generic)
        if (this.data.title === 'Loading...') {
            // Fetch logic here if we had access to API... 
            // For now, let's just leave it or try to fetch using fetch()
            fetch(`http://localhost:8000/api/databases/${this.data.databaseId}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    this.data.title = data.title;
                    title.innerText = data.title;
                })
                .catch(() => {
                    title.innerText = 'Database (Error loading title)';
                });
        }
    }

    save(_blockContent: HTMLElement) {
        return this.data;
    }
}
