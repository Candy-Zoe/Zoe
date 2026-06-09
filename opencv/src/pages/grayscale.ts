import { BasePage } from './BasePage';
import { ImageUploader } from '../components/imageUploader';
import { createSlider } from '../components/shared';

export class GrayscalePage extends BasePage {
  private uploader: ImageUploader;
  private brightness = 0;
  private contrast = 1;

  constructor(container: HTMLElement, state: any) {
    super(container, state);
    this.uploader = new ImageUploader(container, this.onImageLoaded.bind(this));
  }

  render() {
    this.container.innerHTML = `
      <h2 class="page-title">灰度处理</h2>
      <p class="page-desc">调整图像的灰度、亮度和对比度</p>

      <div class="card">
        <div class="card-title">上传图片</div>
        <div id="uploadContainer" style="min-height: 150px;"></div>
      </div>

      <div id="controlsSection" class="card" style="margin-top: 20px; display: none;">
        <div class="card-title">参数调整</div>
        <div id="slidersContainer"></div>
        <div class="btn-group" style="margin-top: 20px;">
          <button class="btn btn-primary" id="applyBtn">应用效果</button>
          <button class="btn btn-secondary" id="resetBtn">重置</button>
          <button class="btn btn-secondary" id="downloadBtn">下载图片</button>
        </div>
      </div>

      <div id="resultSection" class="card" style="margin-top: 20px; display: none;">
        <div class="card-title">处理结果</div>
        <div class="compare-view">
          <div class="compare-item">
            <div class="compare-label">原图</div>
            <div class="result-canvas-wrapper" style="background: var(--bg-tertiary); border-radius: 8px; overflow: hidden;"></div>
          </div>
          <div class="compare-item">
            <div class="compare-label">效果图</div>
            <div id="effectCanvasWrapper" style="background: var(--bg-tertiary); border-radius: 8px; overflow: hidden;"></div>
          </div>
        </div>
      </div>
    `;

    const uploadContainer = document.getElementById('uploadContainer');
    if (uploadContainer) {
      this.uploader.render();
    }

    this.setupControls();
    this.bindEvents();
  }

  private setupControls() {
    const slidersContainer = document.getElementById('slidersContainer');
    if (!slidersContainer) return;

    slidersContainer.appendChild(
      createSlider('亮度', -100, 100, 0, 1, (val) => {
        this.brightness = val;
      })
    );

    slidersContainer.appendChild(
      createSlider('对比度', 0.1, 3, 1, 0.1, (val) => {
        this.contrast = val;
      })
    );
  }

  private bindEvents() {
    document.getElementById('applyBtn')?.addEventListener('click', () => this.applyEffect());
    document.getElementById('resetBtn')?.addEventListener('click', () => this.reset());
    document.getElementById('downloadBtn')?.addEventListener('click', () => this.download());
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

    // 转为灰度图
    const gray = new this.cv.Mat();
    this.cv.cvtColor(srcMat, gray, this.cv.COLOR_RGBA2GRAY);

    // 调整亮度和对比度
    const adjusted = new this.cv.Mat();
    gray.convertTo(adjusted, -1, this.contrast, this.brightness);

    // 显示原图
    const wrapper = this.container.querySelector('.result-canvas-wrapper');
    if (wrapper) {
      const origCanvas = document.createElement('canvas');
      origCanvas.width = srcMat.cols;
      origCanvas.height = srcMat.rows;
      this.cv.imshow(origCanvas, srcMat);
      origCanvas.style.maxWidth = '100%';
      origCanvas.style.display = 'block';
      wrapper.innerHTML = '';
      wrapper.appendChild(origCanvas);
    }

    // 显示效果图
    const effectWrapper = document.getElementById('effectCanvasWrapper');
    if (effectWrapper) {
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = adjusted.cols;
      resultCanvas.height = adjusted.rows;
      this.cv.imshow(resultCanvas, adjusted);
      resultCanvas.style.maxWidth = '100%';
      resultCanvas.style.display = 'block';
      effectWrapper.innerHTML = '';
      effectWrapper.appendChild(resultCanvas);

      (window as any).currentResultCanvas = resultCanvas;
    }

    const resultSection = document.getElementById('resultSection');
    if (resultSection) {
      resultSection.style.display = 'block';
    }

    // 释放内存
    srcMat.delete();
    gray.delete();
    adjusted.delete();
  }

  private reset() {
    this.brightness = 0;
    this.contrast = 1;

    // 更新滑块显示
    const sliders = document.querySelectorAll('.slider-group');
    sliders.forEach((slider, index) => {
      const input = slider.querySelector('input') as HTMLInputElement;
      const valueDisplay = slider.querySelector('.slider-value');
      if (input && valueDisplay) {
        if (index === 0) {
          input.value = '0';
          valueDisplay.textContent = '0';
        } else {
          input.value = '1';
          valueDisplay.textContent = '1';
        }
      }
    });
  }

  private download() {
    const canvas = this.getResultCanvas();
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'grayscale_result.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }
}
