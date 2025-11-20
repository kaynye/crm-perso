import api from '../../api/axios';

export default class MentionTool {
    static get isInline() {
        return true;
    }

    static get sanitize() {
        return {
            a: {
                class: 'mention-link',
                'data-id': true,
                'data-type': true,
                href: true,
            }
        };
    }

    private api: any;
    private button: HTMLButtonElement | null;
    private _state: boolean;

    constructor({ api }: { api: any }) {
        this.api = api;
        this.button = null;
        this._state = false;
    }

    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0v-1.5a9 9 0 1 0 -9.75 9.75" /></svg>';
        this.button.classList.add(this.api.styles.inlineToolButton);

        return this.button;
    }

    surround(range: Range) {
        if (this._state) {
            this.unwrap(range);
            return;
        }

        this.wrap(range);
    }

    wrap(range: Range) {
        const query = prompt('Search for mention (Page, Company, Contact, Task):');
        if (!query) return;

        // We need to handle async search here, which is tricky in surround()
        // So we'll do a quick fetch and then insert.
        // Note: This blocks the UI, which is not ideal but works for MVP.
        // A better way is to show a custom UI.

        api.get(`/search/mentions/?q=${query}`)
            .then(response => {
                const results = response.data;
                if (results.length === 0) {
                    alert('No results found');
                    return;
                }

                // Simple selection for MVP
                const selection = results.map((r: any, i: number) => `${i + 1}. ${r.label} (${r.type})`).join('\n');
                const choice = prompt(`Select item:\n${selection}`);

                if (!choice) return;
                const index = parseInt(choice) - 1;
                if (index >= 0 && index < results.length) {
                    const item = results[index];
                    const link = document.createElement('a');
                    link.href = item.url;
                    link.innerText = `@${item.label}`;
                    link.dataset.id = item.id;
                    link.dataset.type = item.type;
                    link.classList.add('mention-link', 'text-blue-600', 'bg-blue-50', 'px-1', 'rounded', 'no-underline');

                    range.deleteContents();
                    range.insertNode(link);

                    this.api.selection.expandToTag(link);
                }
            })
            .catch(err => {
                console.error(err);
                alert('Search failed');
            });
    }

    unwrap(range: Range) {
        const termWrapper = this.api.selection.findParentTag('A', 'mention-link');

        if (termWrapper) {
            this.api.selection.expandToTag(termWrapper);

            const text = termWrapper.textContent;
            const textNode = document.createTextNode(text || '');

            termWrapper.parentNode?.replaceChild(textNode, termWrapper);
        }
    }

    checkState() {
        const termWrapper = this.api.selection.findParentTag('A', 'mention-link');
        this._state = !!termWrapper;

        if (this._state) {
            this.button?.classList.add(this.api.styles.inlineToolButtonActive);
        } else {
            this.button?.classList.remove(this.api.styles.inlineToolButtonActive);
        }
    }
}
