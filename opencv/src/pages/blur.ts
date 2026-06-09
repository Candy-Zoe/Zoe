import { BasePage } from './BasePage';
import { ImageUploader } from '../components/imageUploader';
import { createSlider, createButtonGroup } from '../components/shared';

export class BlurPage extends BasePage {
  private uploader: ImageUploader;
  private blurType = 'gaussian';
  private kernelSize = 15;
  private sigma = 5;

  constructor(container: HTMLElement, state: any) {
    super(container, state);
    this.uploader = new ImageUploader(container, this.onImageLoaded.bind(this));
  }

  render() {
    this.container.innerHTML = `
      <h2 class="page-title">模糊滤镜</h2>
      <p class="page-desc">使用不同的模糊算法处理图像</p>

      <div class="card">
        <div class="card-title">上传图片</div>
        <div id="uploadContainer" style="min-height: 150px;"></div>
      </div>

      <div id="controlsSection" class="card" style="margin-top: 20px; display: none;">
        <div class="card-title">参数调整</div>
        <div style="margin-bottom: 20px;">
          <div class="slider-label" style="margin-bottom: 8px;">模糊类型</div>
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
        { label: '高斯模糊', active: true, onClick: () => { this.blurType = 'gaussian'; this.updateSliders(); } },
        { label: '均值模糊', onClick: () => { this.blurType = 'blur'; this.updateSliders(); } },
        { label: '中值滤波', onClick: () => { this.blurType = 'median'; this.updateSliders(); } },
        { label: '双边滤波', onClick: () => { this.blurType = 'bilateral'; this.updateSliders(); } }
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

    slidersContainer.appendChild(
      createSlider('核大小', 3, 51, this.kernelSize, 2, (val) => {
        this.kernelSize = val;
      })
    );

    if (this.blurType === 'gaussian' || this.blurType === 'bilateral') {
      slidersContainer.appendChild(
        createSlider('Sigma', 0.1, 30, this.sigma, 0.5, (val) => {
          this.sigma = val;
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
    const ksize = new this.cv.Size(this.kernelSize, this.kernelSize);

    switch (this.blurType) {
      case 'gaussian':
        this.cv.GaussianBlur(srcMat, dst, ksize, this.sigma);
        break;
      case 'blur':
        this.cv.blur(srcMat, dst, ksize);
        break;
      case 'median':
        this.cv.medianBlur(srcMat, dst, this.kernelSize);
        break;
      case 'bilateral':
        this.cv.bilateralFilter(srcMat, dst, this.kernelSize, this.sigma, this.sigma);
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
    dst.delete();
  }

  private reset() {
    this.kernelSize = 15;
    this.sigma = 5;
    this.updateSliders();
  }

  private download() {
    const canvas = this.getResultCanvas();
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'blur_result.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }
}
