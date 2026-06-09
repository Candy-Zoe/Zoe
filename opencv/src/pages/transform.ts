import { BasePage } from './BasePage';
import { ImageUploader } from '../components/imageUploader';
import { createSlider, createButtonGroup } from '../components/shared';

export class TransformPage extends BasePage {
  private uploader: ImageUploader;
  private transformType = 'resize';
  private scale = 1;
  private angle = 0;
  private flipCode = 0;

  constructor(container: HTMLElement, state: any) {
    super(container, state);
    this.uploader = new ImageUploader(container, this.onImageLoaded.bind(this));
  }

  render() {
    this.container.innerHTML = `
      <h2 class="page-title">图像变换</h2>
      <p class="page-desc">缩放、旋转、翻转等几何变换</p>

      <div class="card">
        <div class="card-title">上传图片</div>
        <div id="uploadContainer" style="min-height: 150px;"></div>
      </div>

      <div id="controlsSection" class="card" style="margin-top: 20px; display: none;">
        <div class="card-title">参数调整</div>
        <div style="margin-bottom: 20px;">
          <div class="slider-label" style="margin-bottom: 8px;">变换类型</div>
          <div id="typeButtons"></div>
        </div>
        <div id="slidersContainer"></div>
        <div class="btn-group" style="margin-top: 20px;">
          <button class="btn btn-primary" id="applyBtn">应用效果</button>
          <button class="btn btn-secondary" id="resetBtn">重置</button>
          <button class="btn btn-secondary" id="downloadBtn">下载图片</button>
        </div>
      </div>

      <div id="resultSection" class="card" style="margin-top: 20px; display: none;">
        <div class="card-title">处理结果</div>
        <div id="effectCanvasWrapper" style="background: var(--bg-tertiary); border-radius: 8px; overflow: hidden; padding: 20px; display: flex; justify-content: center;"></div>
      </div>
    `;

    const uploadContainer = document.getElementById('uploadContainer');
    if (uploadContainer) {
      this.uploader.render();
    }

    this.setupControls();
  }

  private setupControls() {
    const typeButtons = document.getElementById('typeButtons');
    if (typeButtons) {
      const group = createButtonGroup([
        { label: '缩放', active: true, onClick: () => { this.transformType = 'resize'; this.updateSliders(); } },
        { label: '旋转', onClick: () => { this.transformType = 'rotate'; this.updateSliders(); } },
        { label: '翻转', onClick: () => { this.transformType = 'flip'; this.updateSliders(); } }
      ]);
      typeButtons.appendChild(group);
    }

    this.createSliders();

    document.getElementById('applyBtn')?.addEventListener('click', () => this.applyEffect());
    document.getElementById('resetBtn')?.addEventListener('click', () => this.reset());
    document.getElementById('downloadBtn')?.addEventListener('click', () => this.download());
  }

  private createSliders() {
    const slidersContainer = document.getElementById('slidersContainer');
    if (!slidersContainer) return;

    slidersContainer.innerHTML = '';

    if (this.transformType === 'resize') {
      slidersContainer.appendChild(
        createSlider('缩放比例', 0.1, 3, 1, 0.1, (val) => {
          this.scale = val;
        })
      );
    } else if (this.transformType === 'rotate') {
      slidersContainer.appendChild(
        createSlider('旋转角度', -180, 180, 0, 1, (val) => {
          this.angle = val;
        })
      );
    } else if (this.transformType === 'flip') {
      const flipGroup = document.createElement('div');
      flipGroup.style.cssText = 'display: flex; gap: 12px;';
      flipGroup.innerHTML = `
        <button class="btn btn-secondary${this.flipCode === 0 ? ' active' : ''}" data-code="0" style="flex: 1;">水平翻转</button>
        <button class="btn btn-secondary${this.flipCode === 1 ? ' active' : ''}" data-code="1" style="flex: 1;">垂直翻转</button>
        <button class="btn btn-secondary${this.flipCode === -1 ? ' active' : ''}" data-code="-1" style="flex: 1;">双向翻转</button>
      `;
      flipGroup.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          flipGroup.querySelectorAll('button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.flipCode = parseInt(btn.getAttribute('data-code') || '0');
        });
      });
      slidersContainer.appendChild(flipGroup);
    }
  }

  private updateSliders() {
    this.createSliders();
  }

  private onImageLoaded(img: HTMLImageElement) {
    this.state.srcImage = img;
    this.uploader.showPreview(img);

    const controlsSection = document.getElementById('controlsSection');
    if (controlsSection) {
      controlsSection.style.display = 'block';
    }
  }

  private applyEffect() {
    if (!this.state.srcImage) return;

    const srcMat = this.getSrcMat();
    if (!srcMat) return;

    const dst = new this.cv.Mat();

    if (this.transformType === 'resize') {
      const width = Math.round(srcMat.cols * this.scale);
      const height = Math.round(srcMat.rows * this.scale);
      this.cv.resize(srcMat, dst, new this.cv.Size(width, height), 0, 0, this.cv.INTER_LINEAR);
    } else if (this.transformType === 'rotate') {
      const center = new this.cv.Point(srcMat.cols / 2, srcMat.rows / 2);
      const rotMat = this.cv.getRotationMatrix2D(center, this.angle, 1);
      this.cv.warpAffine(srcMat, dst, rotMat, new this.cv.Size(srcMat.cols, srcMat.rows));
      rotMat.delete();
    } else if (this.transformType === 'flip') {
      this.cv.flip(srcMat, dst, this.flipCode);
    }

    const effectWrapper = document.getElementById('effectCanvasWrapper');
    if (effectWrapper) {
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = dst.cols;
      resultCanvas.height = dst.rows;
      this.cv.imshow(resultCanvas, dst);
      resultCanvas.style.maxWidth = '100%';
      effectWrapper.innerHTML = '';
      effectWrapper.appendChild(resultCanvas);

      (window as any).currentResultCanvas = resultCanvas;
    }

    const resultSection = document.getElementById('resultSection');
    if (resultSection) {
      resultSection.style.display = 'block';
    }

    srcMat.delete();
    dst.delete();
  }

  private reset() {
    this.scale = 1;
    this.angle = 0;
    this.flipCode = 0;
    this.updateSliders();
  }

  private download() {
    const canvas = this.getResultCanvas();
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'transform_result.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }
}
