// 滑块组件
export function createSlider(
  label: string,
  min: number,
  max: number,
  value: number,
  step: number = 1,
  onChange: (value: number) => void
): HTMLElement {
  const group = document.createElement('div');
  group.className = 'slider-group';

  group.innerHTML = `
    <div class="slider-header">
      <span class="slider-label">${label}</span>
      <span class="slider-value" id="valueDisplay">${value}</span>
    </div>
    <input type="range" min="${min}" max="${max}" value="${value}" step="${step}">
  `;

  const input = group.querySelector('input') as HTMLInputElement;
  const valueDisplay = group.querySelector('#valueDisplay') as HTMLElement;

  input.addEventListener('input', () => {
    const val = parseFloat(input.value);
    valueDisplay.textContent = String(val);
    onChange(val);
  });

  return group;
}

// 按钮组
export function createButtonGroup(
  buttons: { label: string; active?: boolean; onClick: () => void }[]
): HTMLElement {
  const group = document.createElement('div');
  group.className = 'btn-group';

  buttons.forEach((btn) => {
    const button = document.createElement('button');
    button.className = `btn btn-secondary${btn.active ? ' active' : ''}`;
    button.textContent = btn.label;
    button.addEventListener('click', () => {
      group.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      btn.onClick();
    });
    group.appendChild(button);
  });

  return group;
}

// Canvas 容器
export function createCanvasContainer(
  originalCanvas?: HTMLCanvasElement
): { container: HTMLElement; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D | null } {
  const container = document.createElement('div');
  container.className = 'canvas-container';

  const canvas = document.createElement('canvas');
  canvas.id = 'resultCanvas';

  const ctx = canvas.getContext('2d');

  if (originalCanvas) {
    canvas.width = originalCanvas.width;
    canvas.height = originalCanvas.height;
  }

  container.appendChild(canvas);

  return { container, canvas, ctx };
}

// 创建空画布占位符
export function createCanvasPlaceholder(): HTMLElement {
  const placeholder = document.createElement('div');
  placeholder.className = 'canvas-placeholder';
  placeholder.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21,15 16,10 5,21"/>
    </svg>
    <p>上传图片开始处理</p>
  `;
  return placeholder;
}

// 下载图片
export function downloadImage(canvas: HTMLCanvasElement, filename: string = 'result.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
