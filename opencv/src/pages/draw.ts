import { BasePage } from './BasePage';
import { ImageUploader } from '../components/imageUploader';
import { createButtonGroup } from '../components/shared';

type DrawTool = 'rect' | 'circle' | 'line' | 'text';

export class DrawPage extends BasePage {
  private uploader: ImageUploader;
  private currentTool: DrawTool = 'rect';
  private currentColor = '#00d4ff';
  private lineThickness = 2;
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private previewCanvas: HTMLCanvasElement | null = null;
  private previewCtx: CanvasRenderingContext2D | null = null;

  constructor(container: HTMLElement, state: any) {
    super(container, state);
    this.uploader = new ImageUploader(container, this.onImageLoaded.bind(this));
  }

  render() {
    this.container.innerHTML = `
      <h2 class="page-title">绘制工具</h2>
      <p class="page-desc">在图像上绘制矩形、圆形、线条和文字</p>

      <div class="card">
        <div class="card-title">上传图片</div>
        <div id="uploadContainer" style="min-height: 150px;"></div>
      </div>

      <div id="controlsSection" class="card" style="margin-top: 20px; display: none;">
        <div class="card-title">绘制工具</div>
        <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px;">
          <div id="toolButtons"></div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--text-secondary); font-size: 13px;">颜色:</span>
            <input type="color" id="colorPicker" value="${this.currentColor}">
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--text-secondary); font-size: 13px;">线宽:</span>
            <select id="thicknessSelect" style="padding: 6px 10px;">
              <option value="1">1px</option>
              <option value="2" selected>2px</option>
              <option value="4">4px</option>
              <option value="6">6px</option>
              <option value="8">8px</option>
            </select>
          </div>
        </div>
        <div id="textInputContainer" style="display: none; margin-bottom: 20px;">
          <input type="text" id="textInput" placeholder="输入文字" style="background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; color: var(--text-primary); font-size: 14px; width: 200px;">
        </div>
        <div class="btn-group">
          <button class="btn btn-primary" id="applyBtn">应用绘制</button>
          <button class="btn btn-secondary" id="clearBtn">清除</button>
          <button class="btn btn-secondary" id="downloadBtn">下载图片</button>
        </div>
      </div>

      <div id="canvasSection" class="card" style="margin-top: 20px; display: none;">
        <div class="card-title">画布</div>
        <div id="canvasContainer" style="background: var(--bg-tertiary); border-radius: 8px; overflow: auto; max-height: 60vh; display: flex; justify-content: center; padding: 20px;"></div>
      </div>
    `;

    const uploadContainer = document.getElementById('uploadContainer');
    if (uploadContainer) {
      this.uploader.render();
    }

    this.setupControls();
  }

  private setupControls() {
    const toolButtons = document.getElementById('toolButtons');
    if (toolButtons) {
      const group = createButtonGroup([
        { label: '矩形', active: true, onClick: () => { this.currentTool = 'rect'; this.showTextInput(false); } },
        { label: '圆形', onClick: () => { this.currentTool = 'circle'; this.showTextInput(false); } },
        { label: '线条', onClick: () => { this.currentTool = 'line'; this.showTextInput(false); } },
        { label: '文字', onClick: () => { this.currentTool = 'text'; this.showTextInput(true); } }
      ]);
      toolButtons.appendChild(group);
    }

    const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;
    if (colorPicker) {
      colorPicker.addEventListener('input', () => {
        this.currentColor = colorPicker.value;
      });
    }

    const thicknessSelect = document.getElementById('thicknessSelect') as HTMLSelectElement;
    if (thicknessSelect) {
      thicknessSelect.addEventListener('change', () => {
        this.lineThickness = parseInt(thicknessSelect.value);
      });
    }

    document.getElementById('applyBtn')?.addEventListener('click', () => this.applyDrawing());
    document.getElementById('clearBtn')?.addEventListener('click', () => this.clearCanvas());
    document.getElementById('downloadBtn')?.addEventListener('click', () => this.download());
  }

  private showTextInput(show: boolean) {
    const container = document.getElementById('textInputContainer');
    if (container) {
      container.style.display = show ? 'block' : 'none';
    }
  }

  private onImageLoaded(img: HTMLImageElement) {
    this.state.srcImage = img;
    this.uploader.showPreview(img);

    const controlsSection = document.getElementById('controlsSection');
    const canvasSection = document.getElementById('canvasSection');
    const canvasContainer = document.getElementById('canvasContainer');

    if (controlsSection) controlsSection.style.display = 'block';
    if (canvasSection) canvasSection.style.display = 'block';

    if (canvasContainer) {
      canvasContainer.innerHTML = '';

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }

      this.previewCanvas = canvas;
      this.previewCtx = ctx;

      this.setupCanvasEvents(canvas);

      canvas.style.cursor = 'crosshair';
      canvasContainer.appendChild(canvas);
    }
  }

  private setupCanvasEvents(canvas: HTMLCanvasElement) {
    canvas.addEventListener('mousedown', (e) => {
      this.isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.startX = (e.clientX - rect.left) * scaleX;
      this.startY = (e.clientY - rect.top) * scaleY;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.isDrawing || !this.previewCtx) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const currentX = (e.clientX - rect.left) * scaleX;
      const currentY = (e.clientY - rect.top) * scaleY;

      // 恢复原始图像
      if (this.state.srcImage) {
        this.previewCtx.clearRect(0, 0, canvas.width, canvas.height);
        this.previewCtx.drawImage(this.state.srcImage, 0, 0);
      }

      // 绘制预览
      this.previewCtx.strokeStyle = this.currentColor;
      this.previewCtx.lineWidth = this.lineThickness;
      this.previewCtx.fillStyle = this.currentColor;

      if (this.currentTool === 'rect') {
        const width = currentX - this.startX;
        const height = currentY - this.startY;
        this.previewCtx.strokeRect(this.startX, this.startY, width, height);
      } else if (this.currentTool === 'circle') {
        const radius = Math.sqrt(Math.pow(currentX - this.startX, 2) + Math.pow(currentY - this.startY, 2));
        this.previewCtx.beginPath();
        this.previewCtx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
        this.previewCtx.stroke();
      } else if (this.currentTool === 'line') {
        this.previewCtx.beginPath();
        this.previewCtx.moveTo(this.startX, this.startY);
        this.previewCtx.lineTo(currentX, currentY);
        this.previewCtx.stroke();
      }
    });

    canvas.addEventListener('mouseup', () => {
      if (!this.isDrawing) return;
      this.isDrawing = false;

      if (this.currentTool === 'text') {
        const textInput = document.getElementById('textInput') as HTMLInputElement;
        const text = textInput?.value || 'Text';
        this.previewCtx!.font = `${this.lineThickness * 10}px Arial`;
        this.previewCtx!.fillText(text, this.startX, this.startY);
      }
    });

    canvas.addEventListener('mouseleave', () => {
      this.isDrawing = false;
    });
  }

  private applyDrawing() {
    // 绘制已完成，预览即结果
    (window as any).currentResultCanvas = this.previewCanvas;
  }

  private clearCanvas() {
    if (!this.previewCanvas || !this.previewCtx || !this.state.srcImage) return;

    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this.previewCtx.drawImage(this.state.srcImage, 0, 0);
  }

  private download() {
    if (this.previewCanvas) {
      const link = document.createElement('a');
      link.download = 'drawn_image.png';
      link.href = this.previewCanvas.toDataURL('image/png');
      link.click();
    }
  }
}
