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

    private config: any;

    constructor({ api, config }: { api: any, config: any }) {
        this.api = api;
        this.config = config || {};
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
        if (this.config.onMentionRequest) {
            this.config.onMentionRequest(range);
        } else {
            console.warn("MentionTool: onMentionRequest config is missing");
        }
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
