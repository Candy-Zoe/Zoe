// 图片上传器组件
export class ImageUploader {
  private container: HTMLElement;
  private onImageLoaded: (img: HTMLImageElement) => void;
  private previewCanvas: HTMLCanvasElement | null = null;

  constructor(container: HTMLElement, onImageLoaded: (img: HTMLImageElement) => void) {
    this.container = container;
    this.onImageLoaded = onImageLoaded;
  }

  render() {
    this.container.innerHTML = `
      <div class="upload-zone" id="uploadZone">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17,8 12,3 7,8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p>拖拽图片到此处，或<strong style="color: var(--accent)">点击上传</strong></p>
        <p class="hint">支持 JPG、PNG、WebP 格式</p>
        <input type="file" id="fileInput" accept="image/*" class="hidden-input">
      </div>
    `;

    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;

    if (uploadZone && fileInput) {
      uploadZone.addEventListener('click', () => fileInput.click());

      uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
      });

      uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
      });

      uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const file = e.dataTransfer?.files[0];
        if (file && file.type.startsWith('image/')) {
          this.loadImage(file);
        }
      });

      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (file) {
          this.loadImage(file);
        }
      });
    }
  }

  private loadImage(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.onImageLoaded(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  showPreview(img: HTMLImageElement) {
    const uploadZone = document.getElementById('uploadZone');
    if (!uploadZone) return;

    this.previewCanvas = document.createElement('canvas');
    this.previewCanvas.width = img.width;
    this.previewCanvas.height = img.height;
    const ctx = this.previewCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
    }

    uploadZone.innerHTML = '';
    uploadZone.style.padding = '0';
    uploadZone.style.border = 'none';

    const previewWrapper = document.createElement('div');
    previewWrapper.style.cssText = 'position: relative; display: inline-block;';
    previewWrapper.innerHTML = `
      <img src="${this.previewCanvas.toDataURL()}" style="max-width: 100%; display: block; border-radius: 8px;">
      <button class="btn btn-secondary" id="changeImageBtn" style="position: absolute; bottom: 12px; right: 12px; padding: 6px 12px; font-size: 12px;">
        更换图片
      </button>
    `;

    uploadZone.appendChild(previewWrapper);

    document.getElementById('changeImageBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.render();
    });
  }
}
