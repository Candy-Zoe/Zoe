// 导航配置
const navItems = [
  { id: 'home', label: '首页', icon: 'home' },
  { id: 'grayscale', label: '灰度处理', icon: 'image' },
  { id: 'blur', label: '模糊滤镜', icon: 'blur' },
  { id: 'edge', label: '边缘检测', icon: 'edge' },
  { id: 'morphology', label: '形态学', icon: 'morph' },
  { id: 'colorspace', label: '颜色空间', icon: 'color' },
  { id: 'transform', label: '图像变换', icon: 'transform' },
  { id: 'draw', label: '绘制工具', icon: 'draw' }
];

// SVG 图标
const icons: Record<string, string> = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>',
  blur: '<circle cx="12" cy="12" r="10" stroke-dasharray="2 2"/>',
  edge: '<polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>',
  morph: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  color: '<circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20"/>',
  transform: '<polyline points="23,4 23,10 17,10"/><polyline points="1,20 1,14 7,14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  draw: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>'
};

let currentActive: string = 'home';
let switchPageFn: ((page: string) => void) | null = null;

export function initNav(containerId: string, onSwitch: (page: string) => void) {
  const container = document.getElementById(containerId);
  if (!container) return;

  switchPageFn = onSwitch;

  container.innerHTML = navItems.map(item => `
    <div class="nav-item${item.id === 'home' ? ' active' : ''}" data-page="${item.id}">
      <svg viewBox="0 0 24 24">${icons[item.icon]}</svg>
      <span>${item.label}</span>
    </div>
  `).join('');

  container.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.nav-item');
    if (target) {
      const page = target.getAttribute('data-page');
      if (page && page !== currentActive) {
        setActivePage(page);
        switchPageFn?.(page);
      }
    }
  });
}

export function setActivePage(pageId: string) {
  currentActive = pageId;
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-page') === pageId);
  });
}
