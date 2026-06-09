// OpenCV.js 加载 - 支持本地和CDN模式
const OPENCV_LOCAL_PATH = '/opencv/opencv.js';
const OPENCV_CDN_URL = 'https://docs.opencv.org/4.9.0/opencv.js';

let useLocalMode = false;

export function setLocalMode(enabled: boolean) {
  useLocalMode = enabled;
}

export function isLocalMode(): boolean {
  return useLocalMode;
}

export const loadOpenCV = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).cv) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = useLocalMode ? OPENCV_LOCAL_PATH : OPENCV_CDN_URL;
    script.async = true;
    
    const loadTimeout = setTimeout(() => {
      if (!useLocalMode) {
        console.log('CDN加载超时，尝试本地模式');
        script.src = OPENCV_LOCAL_PATH;
      } else {
        reject(new Error('OpenCV.js 加载超时'));
      }
    }, 10000);

    script.onload = () => {
      clearTimeout(loadTimeout);
      const checkCV = setInterval(() => {
        if ((window as any).cv) {
          clearInterval(checkCV);
          resolve();
        }
      }, 100);
    };

    script.onerror = () => {
      clearTimeout(loadTimeout);
      if (!useLocalMode) {
        console.log('CDN加载失败，尝试本地模式');
        script.src = OPENCV_LOCAL_PATH;
        document.head.appendChild(script);
      } else {
        reject(new Error('OpenCV.js 加载失败'));
      }
    };

    document.head.appendChild(script);
  });
};

export const loadOpenCVWithProgress = (
  onProgress?: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).cv) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = useLocalMode ? OPENCV_LOCAL_PATH : OPENCV_CDN_URL;
    script.async = true;

    if (onProgress) {
      onProgress(0);
      let loaded = 0;
      const interval = setInterval(() => {
        loaded += 2;
        if (loaded < 90) {
          onProgress(loaded);
        }
      }, 100);

      script.onload = () => {
        clearInterval(interval);
        onProgress(95);
        const checkCV = setInterval(() => {
          if ((window as any).cv) {
            clearInterval(checkCV);
            onProgress(100);
            resolve();
          }
        }, 50);
      };

      script.onerror = () => {
        clearInterval(interval);
        reject(new Error('OpenCV.js 加载失败'));
      };
    } else {
      script.onload = () => {
        const checkCV = setInterval(() => {
          if ((window as any).cv) {
            clearInterval(checkCV);
            resolve();
          }
        }, 100);
      };
      script.onerror = reject;
    }

    document.head.appendChild(script);
  });
};
