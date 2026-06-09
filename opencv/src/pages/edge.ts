import { BasePage } from './BasePage';
import { ImageUploader } from '../components/imageUploader';
import { createSlider, createButtonGroup } from '../components/shared';

export class EdgePage extends BasePage {
  private uploader: ImageUploader;
  private edgeType = 'canny';
  private threshold1 = 100;
  private threshold2 = 200;
  private apertureSize = 3;

  constructor(container: HTMLElement, state: any) {
    super(container, state);
    this.uploader = new ImageUploader(container, this.onImageLoaded.bind(this));
  }

  render() {
    this.container.innerHTML = `
      <h2 class="page-title">边缘检测</h2>
      <p class="page-desc">使用不同算子检测图像边缘</p>

      <div class="card">
        <div class="card-title">上传图片</div>
        <div id="uploadContainer" style="min-height: 150px;"></div>
      </div>

      <div id="controlsSection" class="card" style="margin-top: 20px; display: none;">
        <div class="card-title">参数调整</div>
        <div style="margin-bottom: 20px;">
          <div class="slider-label" style="margin-bottom: 8px;">检测算法</div>
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
        { label: 'Canny', active: true, onClick: () => { this.edgeType = 'canny'; this.updateSliders(); } },
        { label: 'Sobel', onClick: () => { this.edgeType = 'sobel'; this.updateSliders(); } },
        { label: 'Laplacian', onClick: () => { this.edgeType = 'laplacian'; this.updateSliders(); } }
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

    if (this.edgeType === 'canny') {
      slidersContainer.appendChild(
        createSlider('阈值1', 0, 300, this.threshold1, 1, (val) => {
          this.threshold1 = val;
        })
      );
      slidersContainer.appendChild(
        createSlider('阈值2', 0, 300, this.threshold2, 1, (val) => {
          this.threshold2 = val;
        })
      );
    } else if (this.edgeType === 'sobel') {
      slidersContainer.appendChild(
        createSlider('阈值', 0, 300, 100, 1, (val) => {
          this.threshold1 = val;
        })
      );
    } else if (this.edgeType === 'laplacian') {
      slidersContainer.appendChild(
        createSlider('核大小', 1, 7, 3, 2, (val) => {
          this.apertureSize = val;
        })
      );
      slidersContainer.appendChild(
        createSlider('阈值', 0, 300, 100, 1, (val) => {
          this.threshold1 = val;
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

    const gray = new this.cv.Mat();
    this.cv.cvtColor(srcMat, gray, this.cv.COLOR_RGBA2GRAY);

    const dst = new this.cv.Mat();

    if (this.edgeType === 'canny') {
      this.cv.Canny(gray, dst, this.threshold1, this.threshold2);
    } else if (this.edgeType === 'sobel') {
      const sobelx = new this.cv.Mat();
      const sobely = new this.cv.Mat();
      this.cv.Sobel(gray, sobelx, this.cv.CV_16S, 1, 0, this.apertureSize);
      this.cv.Sobel(gray, sobely, this.cv.CV_16S, 0, 1, this.apertureSize);
      this.cv.convertScaleAbs(sobelx, sobelx);
      this.cv.convertScaleAbs(sobely, sobely);
      this.cv.addWeighted(sobelx, 0.5, sobely, 0.5, 0, dst);
      sobelx.delete();
      sobely.delete();
    } else if (this.edgeType === 'laplacian') {
      const laplacian = new this.cv.Mat();
      this.cv.Laplacian(gray, laplacian, this.cv.CV_16S, this.apertureSize);
      this.cv.convertScaleAbs(laplacian, dst);
      laplacian.delete();
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
    gray.delete();
    dst.delete();
  }

  private reset() {
    this.threshold1 = 100;
    this.threshold2 = 200;
    this.apertureSize = 3;
    this.updateSliders();
  }

  private download() {
    const canvas = this.getResultCanvas();
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'edge_result.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }
}
