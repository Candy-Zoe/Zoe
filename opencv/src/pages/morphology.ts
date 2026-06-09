import { BasePage } from './BasePage';
import { ImageUploader } from '../components/imageUploader';
import { createSlider, createButtonGroup } from '../components/shared';

export class MorphologyPage extends BasePage {
  private uploader: ImageUploader;
  private morphType = 'erode';
  private kernelSize = 5;
  private iterations = 1;

  constructor(container: HTMLElement, state: any) {
    super(container, state);
    this.uploader = new ImageUploader(container, this.onImageLoaded.bind(this));
  }

  render() {
    this.container.innerHTML = `
      <h2 class="page-title">形态学运算</h2>
      <p class="page-desc">腐蚀、膨胀、开运算、闭运算等形态学变换</p>

      <div class="card">
        <div class="card-title">上传图片</div>
        <div id="uploadContainer" style="min-height: 150px;"></div>
      </div>

      <div id="controlsSection" class="card" style="margin-top: 20px; display: none;">
        <div class="card-title">参数调整</div>
        <div style="margin-bottom: 20px;">
          <div class="slider-label" style="margin-bottom: 8px;">运算类型</div>
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
        { label: '腐蚀', active: true, onClick: () => { this.morphType = 'erode'; } },
        { label: '膨胀', onClick: () => { this.morphType = 'dilate'; } },
        { label: '开运算', onClick: () => { this.morphType = 'open'; } },
        { label: '闭运算', onClick: () => { this.morphType = 'close'; } }
      ]);
      typeButtons.appendChild(group);
    }

    const slidersContainer = document.getElementById('slidersContainer');
    if (slidersContainer) {
      slidersContainer.innerHTML = '';
      slidersContainer.appendChild(
        createSlider('核大小', 3, 21, this.kernelSize, 2, (val) => {
          this.kernelSize = val;
        })
      );
      slidersContainer.appendChild(
        createSlider('迭代次数', 1, 10, this.iterations, 1, (val) => {
          this.iterations = val;
        })
      );
    }

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

    const dst = new this.cv.Mat();
    const kernel = this.cv.getStructuringElement(this.cv.MORPH_RECT, new this.cv.Size(this.kernelSize, this.kernelSize));

    switch (this.morphType) {
      case 'erode':
        this.cv.erode(srcMat, dst, kernel, { iterations: this.iterations });
        break;
      case 'dilate':
        this.cv.dilate(srcMat, dst, kernel, { iterations: this.iterations });
        break;
      case 'open':
        this.cv.morphologyEx(srcMat, dst, this.cv.MORPH_OPEN, kernel, { iterations: this.iterations });
        break;
      case 'close':
        this.cv.morphologyEx(srcMat, dst, this.cv.MORPH_CLOSE, kernel, { iterations: this.iterations });
        break;
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
    kernel.delete();
    dst.delete();
  }

  private reset() {
    this.kernelSize = 5;
    this.iterations = 1;
    this.updateSliders();
  }

  private updateSliders() {
    const sliders = document.querySelectorAll('.slider-group');
    sliders.forEach((slider, index) => {
      const input = slider.querySelector('input') as HTMLInputElement;
      const valueDisplay = slider.querySelector('.slider-value');
      if (input && valueDisplay) {
        if (index === 0) {
          input.value = '5';
          valueDisplay.textContent = '5';
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
      link.download = 'morphology_result.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }
}
