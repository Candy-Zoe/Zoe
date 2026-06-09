// 基础页面类
export abstract class BasePage {
  protected container: HTMLElement;
  protected state: any;

  constructor(container: HTMLElement, state: any) {
    this.container = container;
    this.state = state;
  }

  abstract render(): void;

  protected get cv() {
    return window.cv;
  }

  protected getSrcMat(): any {
    if (!this.state.srcImage) return null;

    const canvas = document.createElement('canvas');
    canvas.width = this.state.srcImage.width;
    canvas.height = this.state.srcImage.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(this.state.srcImage, 0, 0);
    return this.cv.imread(canvas);
  }

  protected showImage(canvas: HTMLCanvasElement) {
    const container = this.container.querySelector('.canvas-wrapper');
    if (!container) return;

    const img = new Image();
    img.onload = () => {
      container.innerHTML = '';
      const newCanvas = document.createElement('canvas');
      newCanvas.width = img.width;
      newCanvas.height = img.height;
      newCanvas.getContext('2d')?.drawImage(img, 0, 0);
      newCanvas.style.maxWidth = '100%';
      newCanvas.style.borderRadius = '8px';
      container.appendChild(newCanvas);
    };
    img.src = canvas.toDataURL();
  }

  protected updateResult(mat: any) {
    const container = this.container.querySelector('.result-canvas-wrapper');
    if (!container || !mat) return;

    const canvas = document.createElement('canvas');
    canvas.width = mat.cols;
    canvas.height = mat.rows;
    this.cv.imshow(canvas, mat);
    canvas.style.maxWidth = '100%';
    canvas.style.borderRadius = '8px';

    container.innerHTML = '';
    container.appendChild(canvas);

    // 存储当前 canvas 供下载使用
    (window as any).currentResultCanvas = canvas;
  }

  protected getResultCanvas(): HTMLCanvasElement | null {
    return (window as any).currentResultCanvas || null;
  }
}
