import { BasePage } from './BasePage';
import { ImageUploader } from '../components/imageUploader';

export class HomePage extends BasePage {
  private uploader: ImageUploader;

  constructor(container: HTMLElement, state: any) {
    super(container, state);
    this.uploader = new ImageUploader(container, this.onImageLoaded.bind(this));
  }

  render() {
    this.container.innerHTML = `
      <h2 class="page-title">OpenCV 在线调试平台</h2>
      <p class="page-desc">纯前端实现的 OpenCV.js 图像处理工具，无需安装即可在浏览器中体验 OpenCV 的强大功能</p>

      <div class="grid-3">
        <div class="card">
          <div class="card-title">快速上手</div>
          <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6;">
            选择左侧导航中的功能模块，上传图片后即可实时预览处理效果。支持亮度调整、模糊滤镜、边缘检测等多种图像处理功能。
          </p>
        </div>

        <div class="card">
          <div class="card-title">支持的功能</div>
          <ul style="color: var(--text-secondary); font-size: 14px; line-height: 2; padding-left: 20px;">
            <li>灰度处理与亮度对比度调整</li>
            <li>多种模糊滤镜</li>
            <li>边缘检测算法</li>
            <li>形态学运算</li>
            <li>颜色空间转换</li>
            <li>图像几何变换</li>
            <li>绘制图形与文字</li>
          </ul>
        </div>

        <div class="card">
          <div class="card-title">技术特点</div>
          <ul style="color: var(--text-secondary); font-size: 14px; line-height: 2; padding-left: 20px;">
            <li>纯前端实现，保护隐私</li>
            <li>图片在本地处理，不上传服务器</li>
            <li>实时预览，参数调整即时生效</li>
            <li>支持原图/效果对比</li>
            <li>一键导出处理结果</li>
          </ul>
        </div>
      </div>

      <div class="card" style="margin-top: 20px;">
        <div class="card-title">上传图片开始</div>
        <div id="uploadContainer" class="upload-wrapper" style="min-height: 200px;"></div>
      </div>

      <div id="previewSection" class="card" style="margin-top: 20px; display: none;">
        <div class="card-title">图片预览</div>
        <div class="canvas-wrapper" style="background: var(--bg-tertiary); border-radius: 8px; padding: 20px; display: flex; justify-content: center;"></div>
        <div class="btn-group" style="margin-top: 16px;">
          <button class="btn btn-primary" id="processBtn">
            <svg viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
            去灰度处理
          </button>
        </div>
      </div>
    `;

    const uploadContainer = document.getElementById('uploadContainer');
    if (uploadContainer) {
      this.uploader.render();
    }

    document.getElementById('processBtn')?.addEventListener('click', () => {
      (window as any).switchPage?.('grayscale');
    });
  }

  private onImageLoaded(img: HTMLImageElement) {
    this.state.srcImage = img;

    const previewSection = document.getElementById('previewSection');
    const canvasWrapper = this.container.querySelector('.canvas-wrapper') as HTMLElement;

    if (previewSection && canvasWrapper) {
      previewSection.style.display = 'block';

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      canvas.style.maxWidth = '100%';
      canvas.style.borderRadius = '8px';

      canvasWrapper.innerHTML = '';
      canvasWrapper.appendChild(canvas);

      this.uploader.showPreview(img);
    }
  }
}
