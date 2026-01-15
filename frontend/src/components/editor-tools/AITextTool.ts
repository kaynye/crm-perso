
import axios from 'axios';

interface AIState {
    selection: Range | null;
    originalText: string;
}

export default class AITextTool {
    api: any;
    button: HTMLButtonElement | null;
    _state: AIState;
    tag: string;
    class: string;
    popover: HTMLElement | null;

    static get isInline() {
        return true;
    }

    static get title() {
        return 'AI Assistant';
    }

    constructor({ api }: { api: any }) {
        this.api = api;
        this.button = null;
        this._state = {
            selection: null,
            originalText: ''
        };
        this.tag = 'SPAN';
        this.class = 'ai-text-tool';
        this.popover = null;
    }

    render() {
        console.log('AITextTool Rendering');
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>';
        this.button.classList.add(this.api.styles.inlineToolButton);

        return this.button;
    }

    surround(range: Range) {
        if (!range) {
            return;
        }

        // Check if we are inside our tag
        // const termWrapper = this.api.selection.findParentTag(this.tag, this.class);

        // If already selected, maybe unwrap? or show menu?
        // For this tool, we generally want to perform an action on the *current* selection

        this._state.selection = range;
        this._state.originalText = range.toString();

        this.togglePopover(range);
    }

    checkState() {
        const termTag = this.api.selection.findParentTag(this.tag, this.class);
        this.button?.classList.toggle(this.api.styles.inlineToolButtonActive, !!termTag);
    }

    togglePopover(range: Range) {
        if (this.popover) {
            this.destroyPopover();
            return;
        }

        this.popover = document.createElement('div');
        this.popover.className = 'absolute z-50 bg-white shadow-xl border border-gray-200 rounded-lg p-2 flex flex-col gap-1 min-w-[200px] animate-in fade-in zoom-in duration-200';

        // Position it
        const rect = range.getBoundingClientRect();
        this.popover.style.top = `${rect.bottom + window.scrollY + 10}px`;
        this.popover.style.left = `${rect.left + window.scrollX}px`;

        // Actions
        const actions = [
            { label: '✨ Improve writing', type: 'improve' },
            { label: '🤏 Shorten', type: 'shorter' },
            { label: '📖 Expand', type: 'longer' },
            { label: '🔧 Fix grammar', type: 'fix' },
            { label: '⚡ Continue', type: 'zap' },
        ];

        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'text-left text-sm px-3 py-2 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2 text-gray-700';
            btn.innerText = action.label;
            btn.onclick = () => this.executeAction(action.type);
            this.popover?.appendChild(btn);
        });

        document.body.appendChild(this.popover);

        // Close on click outside
        const handleOutsideClick = (e: MouseEvent) => {
            if (this.popover && !this.popover.contains(e.target as Node) && !this.button?.contains(e.target as Node)) {
                this.destroyPopover();
                document.removeEventListener('mousedown', handleOutsideClick);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', handleOutsideClick), 0);
    }

    destroyPopover() {
        if (this.popover) {
            this.popover.remove();
            this.popover = null;
        }
    }

    async executeAction(type: string) {
        if (!this._state.selection || !this._state.originalText) return;

        // Show loading state
        if (this.popover) {
            this.popover.innerHTML = '<div class="p-3 text-sm text-gray-500 flex items-center gap-2"><div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div> AI is thinking...</div>';
        }

        try {
            // Get token
            const token = localStorage.getItem('access_token'); // Or however we get it

            // TODO: Use configured base URL
            const response = await axios.post('http://localhost:8000/api/ai/completion/', {
                text: this._state.originalText,
                type: type
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const completion = response.data.completion;

            // Replace text
            if (this._state.selection) {
                this._state.selection.deleteContents();

                // If the response contains HTML, insert it as HTML, otherwise text
                const textNode = document.createTextNode(completion);
                this._state.selection.insertNode(textNode);

                // Ensure popover is closed
                this.destroyPopover();

                // Clear selection
                window.getSelection()?.removeAllRanges();
            }

        } catch (error) {
            console.error('AI Error:', error);
            if (this.popover) {
                this.popover.innerHTML = '<div class="p-3 text-sm text-red-500">Error generating text.</div>';
                setTimeout(() => this.destroyPopover(), 2000);
            }
        }
    }
}
