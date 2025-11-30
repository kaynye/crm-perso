import api from '../../api/axios';

export default class AttachesTool {
    static get toolbox() {
        return {
            title: 'Attachment',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>'
        };
    }

    private data: { url: string; name: string; size: number };
    private wrapper: HTMLElement | undefined;

    constructor({ data }: { data: any, api: any }) {
        this.data = data;
        this.wrapper = undefined;
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.classList.add('cdx-attaches');

        if (this.data && this.data.url) {
            this._renderFile();
            return this.wrapper;
        }

        const button = document.createElement('div');
        button.classList.add('cdx-attaches__button');
        button.innerHTML = `
            <div class="cdx-attaches__button-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
            </div>
            <div class="cdx-attaches__button-text">
                Select file to upload
            </div>
        `;

        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';

        button.addEventListener('click', () => {
            input.click();
        });

        input.addEventListener('change', (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                this.uploadFile(file);
            }
        });

        this.wrapper.appendChild(button);
        this.wrapper.appendChild(input);

        return this.wrapper;
    }

    save(_blockContent: HTMLElement) {
        return this.data;
    }

    async uploadFile(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                this.data = {
                    url: response.data.file.url,
                    name: response.data.file.name,
                    size: response.data.file.size
                };
                this._renderFile();
            } else {
                console.error('Upload failed:', response.data.error);
                alert('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload error');
        }
    }

    _renderFile() {
        if (!this.wrapper) return;

        this.wrapper.innerHTML = '';
        this.wrapper.classList.add('cdx-attaches--filled');

        const fileWrapper = document.createElement('a');
        fileWrapper.href = this.data.url;
        fileWrapper.target = '_blank';
        fileWrapper.classList.add('cdx-attaches__file');

        // Check if image
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(this.data.name);

        if (isImage) {
            fileWrapper.innerHTML = `
                <div class="cdx-attaches__file-image">
                    <img src="${this.data.url}" alt="${this.data.name}" style="max-width: 100%; border-radius: 8px;" />
                </div>
                <div class="cdx-attaches__file-info">
                    <div class="cdx-attaches__file-name">${this.data.name}</div>
                    <div class="cdx-attaches__file-size">${this._formatSize(this.data.size)}</div>
                </div>
            `;
        } else {
            fileWrapper.innerHTML = `
                <div class="cdx-attaches__file-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                </div>
                <div class="cdx-attaches__file-info">
                    <div class="cdx-attaches__file-name">${this.data.name}</div>
                    <div class="cdx-attaches__file-size">${this._formatSize(this.data.size)}</div>
                </div>
            `;
        }

        this.wrapper.appendChild(fileWrapper);
    }

    _formatSize(size: number) {
        const i = Math.floor(Math.log(size) / Math.log(1024));
        return (size / Math.pow(1024, i)).toFixed(2) + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
    }
}
