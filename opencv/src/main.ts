import './style.css';
import { loadOpenCVWithProgress, setLocalMode } from './utils/opencv';
import { initNav, setActivePage } from './components/nav';
import { HomePage } from './pages/home';
import { GrayscalePage } from './pages/grayscale';
import { BlurPage } from './pages/blur';
import { EdgePage } from './pages/edge';
import { MorphologyPage } from './pages/morphology';
import { ColorspacePage } from './pages/colorspace';
import { TransformPage } from './pages/transform';
import { DrawPage } from './pages/draw';

declare global {
  interface Window {
    cv: any;
  }
}

interface AppState {
  currentPage: string;
  srcImage: HTMLImageElement | null;
  originalMat: any;
}

const state: AppState = {
  currentPage: 'home',
  srcImage: null,
  originalMat: null
};

const pages: Record<string, { render: (container: HTMLElement) => void }> = {
  home: { render: (c) => new HomePage(c, state).render() },
  grayscale: { render: (c) => new GrayscalePage(c, state).render() },
  blur: { render: (c) => new BlurPage(c, state).render() },
  edge: { render: (c) => new EdgePage(c, state).render() },
  morphology: { render: (c) => new MorphologyPage(c, state).render() },
  colorspace: { render: (c) => new ColorspacePage(c, state).render() },
  transform: { render: (c) => new TransformPage(c, state).render() },
  draw: { render: (c) => new DrawPage(c, state).render() }
};

function switchPage(pageName: string) {
  if (!pages[pageName]) return;

  state.currentPage = pageName;
  const content = document.querySelector('.content') as HTMLElement;
  if (content) {
    content.innerHTML = '';
    pages[pageName].render(content);
  }
  setActivePage(pageName);
}

async function init(mode: 'auto' | 'local' | 'cdn' = 'auto') {
  const app = document.getElementById('app');
  if (!app) return;

  if (mode === 'auto') {
    app.innerHTML = `
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在加载 OpenCV.js...</div>
        <div class="loading-progress-bar">
          <div class="loading-progress-fill" id="progressFill"></div>
        </div>
        <div class="loading-modes" style="margin-top: 20px;">
          <button class="btn btn-secondary" id="useLocalBtn" style="margin-right: 10px;">
            使用本地版本
          </button>
          <button class="btn btn-secondary" id="useCdnBtn">
            使用 CDN 版本
          </button>
        </div>
      </div>
    `;
  } else {
    app.innerHTML = `
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在加载 ${mode === 'local' ? '本地' : 'CDN'} OpenCV.js...</div>
        <div class="loading-progress-bar">
          <div class="loading-progress-fill" id="progressFill"></div>
        </div>
      </div>
    `;
  }

  if (mode === 'auto') {
    document.getElementById('useLocalBtn')?.addEventListener('click', () => init('local'));
    document.getElementById('useCdnBtn')?.addEventListener('click', () => init('cdn'));
  }

  try {
    if (mode === 'local') {
      setLocalMode(true);
    } else if (mode === 'cdn') {
      setLocalMode(false);
    }

    await loadOpenCVWithProgress((progress) => {
      const progressFill = document.getElementById('progressFill');
      if (progressFill) {
        progressFill.style.width = `${progress}%`;
      }
    });

    console.log('OpenCV.js 加载成功');

    app.innerHTML = `
      <nav class="nav">
        <div class="nav-header">
          <div class="nav-logo">
            <svg viewBox="0 0 36 36">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#00d4ff"/>
                  <stop offset="100%" stop-color="#00ff88"/>
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="8" fill="#252542"/>
              <text x="18" y="25" text-anchor="middle" fill="url(#logoGrad)" font-family="Arial" font-weight="bold" font-size="16">CV</text>
            </svg>
            <h1>OpenCV 调试</h1>
          </div>
        </div>
        <div class="nav-menu" id="navMenu"></div>
      </nav>
      <main class="main">
        <div class="content"></div>
      </main>
    `;

    initNav('navMenu', switchPage);
    switchPage('home');

  } catch (error) {
    if (mode === 'auto' || mode === 'cdn') {
      app.innerHTML = `
        <div class="loading-overlay">
          <div class="loading-text" style="color: var(--danger)">CDN 加载失败</div>
          <div class="loading-text" style="margin-top: 10px;">正在尝试本地版本...</div>
        </div>
      `;
      setTimeout(() => init('local'), 1000);
    } else {
      app.innerHTML = `
        <div class="loading-overlay">
          <div class="loading-text" style="color: var(--danger)">OpenCV.js 加载失败</div>
          <div class="loading-text" style="margin-top: 10px; font-size: 12px;">请确保已下载 OpenCV.js 到 public/opencv/ 目录</div>
          <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px">重试</button>
        </div>
      `;
      console.error('OpenCV 加载失败:', error);
    }
  }
}

(window as any).appState = state;
(window as any).switchPage = switchPage;
(window as any).initApp = init;

init();
