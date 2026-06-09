import { BasePage } from './BasePage';
import { ImageUploader } from '../components/imageUploader';
import { createSlider, createButtonGroup } from '../components/shared';

export class ColorspacePage extends BasePage {
  private uploader: ImageUploader;
  private targetSpace = 'hsv';
  private hueShift = 0;
  private saturationScale = 1;
  private valueScale = 1;

  constructor(container: HTMLElement, state: any) {
    super(container, state);
    this.uploader = new ImageUploader(container, this.onImageLoaded.bind(this));
  }

  render() {
    this.container.innerHTML = `
      <h2 class="page-title">颜色空间</h2>
      <p class="page-desc">在 RGB、HSV、LAB 等颜色空间之间转换和调整</p>

      <div class="card">
        <div class="card-title">上传图片</div>
        <div id="uploadContainer" style="min-height: 150px;"></div>
      </div>

      <div id="controlsSection" class="card" style="margin-top: 20px; display: none;">
        <div class="card-title">参数调整</div>
        <div style="margin-bottom: 20px;">
          <div class="slider-label" style="margin-bottom: 8px;">目标颜色空间</div>
          <div id="spaceButtons"></div>
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
    const spaceButtons = document.getElementById('spaceButtons');
    if (spaceButtons) {
      const group = createButtonGroup([
        { label: 'HSV', active: true, onClick: () => { this.targetSpace = 'hsv'; this.updateSliders(); } },
        { label: 'LAB', onClick: () => { this.targetSpace = 'lab'; this.updateSliders(); } },
        { label: 'YCrCb', onClick: () => { this.targetSpace = 'ycrcb'; this.updateSliders(); } }
      ]);
      spaceButtons.appendChild(group);
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

    if (this.targetSpace === 'hsv') {
      slidersContainer.appendChild(
        createSlider('色相偏移', -180, 180, 0, 1, (val) => {
          this.hueShift = val;
        })
      );
      slidersContainer.appendChild(
        createSlider('饱和度', 0, 2, 1, 0.1, (val) => {
          this.saturationScale = val;
        })
      );
      slidersContainer.appendChild(
        createSlider('亮度', 0, 2, 1, 0.1, (val) => {
          this.valueScale = val;
        })
      );
    } else if (this.targetSpace === 'lab') {
      slidersContainer.appendChild(
        createSlider('L 通道', 0, 2, 1, 0.1, (val) => {
          this.valueScale = val;
        })
      );
      slidersContainer.appendChild(
        createSlider('a 通道', 0.5, 1.5, 1, 0.1, (val) => {
          this.saturationScale = val;
        })
      );
      slidersContainer.appendChild(
        createSlider('b 通道', 0.5, 1.5, 1, 0.1, (val) => {
          this.hueShift = val;
        })
      );
    } else if (this.targetSpace === 'ycrcb') {
      slidersContainer.appendChild(
        createSlider('Y 通道', 0, 2, 1, 0.1, (val) => {
          this.valueScale = val;
        })
      );
      slidersContainer.appendChild(
        createSlider('Cr 通道', 0.5, 1.5, 1, 0.1, (val) => {
          this.saturationScale = val;
        })
      );
      slidersContainer.appendChild(
        createSlider('Cb 通道', 0.5, 1.5, 1, 0.1, (val) => {
          this.hueShift = val;
        })
      );
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

    if (this.targetSpace === 'hsv') {
      const hsv = new this.cv.Mat();
      this.cv.cvtColor(srcMat, hsv, this.cv.COLOR_RGBA2RGB);
      this.cv.cvtColor(hsv, hsv, this.cv.COLOR_RGB2HSV);

      const channels = new this.cv.MatVector();
      this.cv.split(hsv, channels);

      if (this.hueShift !== 0) {
        channels.get(0).convertTo(channels.get(0), -1, 1, this.hueShift);
      }
      if (this.saturationScale !== 1) {
        channels.get(1).convertTo(channels.get(1), -1, this.saturationScale, 0);
      }
      if (this.valueScale !== 1) {
        channels.get(2).convertTo(channels.get(2), -1, this.valueScale, 0);
      }

      this.cv.merge(channels, hsv);
      this.cv.cvtColor(hsv, dst, this.cv.COLOR_HSV2RGB);

      hsv.delete();
      channels.delete();
    } else if (this.targetSpace === 'lab') {
      this.cv.cvtColor(srcMat, dst, this.cv.COLOR_RGB2Lab);
    } else if (this.targetSpace === 'ycrcb') {
      this.cv.cvtColor(srcMat, dst, this.cv.COLOR_RGB2YCrCb);
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
    this.hueShift = 0;
    this.saturationScale = 1;
    this.valueScale = 1;
    this.updateSliders();
  }

  private download() {
    const canvas = this.getResultCanvas();
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'colorspace_result.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }
}
