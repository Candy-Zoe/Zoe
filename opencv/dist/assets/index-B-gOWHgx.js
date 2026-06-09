var B=Object.defineProperty;var I=(l,a,t)=>a in l?B(l,a,{enumerable:!0,configurable:!0,writable:!0,value:t}):l[a]=t;var o=(l,a,t)=>I(l,typeof a!="symbol"?a+"":a,t);(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))e(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const n of s.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&e(n)}).observe(document,{childList:!0,subtree:!0});function t(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function e(i){if(i.ep)return;i.ep=!0;const s=t(i);fetch(i.href,s)}})();const L="/opencv/opencv.js",k="https://docs.opencv.org/4.9.0/opencv.js";let w=!1;function b(l){w=l}const T=l=>new Promise((a,t)=>{if(window.cv){a();return}const e=document.createElement("script");if(e.src=w?L:k,e.async=!0,l){l(0);let i=0;const s=setInterval(()=>{i+=2,i<90&&l(i)},100);e.onload=()=>{clearInterval(s),l(95);const n=setInterval(()=>{window.cv&&(clearInterval(n),l(100),a())},50)},e.onerror=()=>{clearInterval(s),t(new Error("OpenCV.js 加载失败"))}}else e.onload=()=>{const i=setInterval(()=>{window.cv&&(clearInterval(i),a())},100)},e.onerror=t;document.head.appendChild(e)}),M=[{id:"home",label:"首页",icon:"home"},{id:"grayscale",label:"灰度处理",icon:"image"},{id:"blur",label:"模糊滤镜",icon:"blur"},{id:"edge",label:"边缘检测",icon:"edge"},{id:"morphology",label:"形态学",icon:"morph"},{id:"colorspace",label:"颜色空间",icon:"color"},{id:"transform",label:"图像变换",icon:"transform"},{id:"draw",label:"绘制工具",icon:"draw"}],R={home:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>',image:'<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>',blur:'<circle cx="12" cy="12" r="10" stroke-dasharray="2 2"/>',edge:'<polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>',morph:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',color:'<circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20"/>',transform:'<polyline points="23,4 23,10 17,10"/><polyline points="1,20 1,14 7,14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',draw:'<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>'};let x="home",m=null;function H(l,a){const t=document.getElementById(l);t&&(m=a,t.innerHTML=M.map(e=>`
    <div class="nav-item${e.id==="home"?" active":""}" data-page="${e.id}">
      <svg viewBox="0 0 24 24">${R[e.icon]}</svg>
      <span>${e.label}</span>
    </div>
  `).join(""),t.addEventListener("click",e=>{const i=e.target.closest(".nav-item");if(i){const s=i.getAttribute("data-page");s&&s!==x&&(S(s),m==null||m(s))}}))}function S(l){x=l,document.querySelectorAll(".nav-item").forEach(a=>{a.classList.toggle("active",a.getAttribute("data-page")===l)})}class h{constructor(a,t){o(this,"container");o(this,"state");this.container=a,this.state=t}get cv(){return window.cv}getSrcMat(){if(!this.state.srcImage)return null;const a=document.createElement("canvas");a.width=this.state.srcImage.width,a.height=this.state.srcImage.height;const t=a.getContext("2d");return t?(t.drawImage(this.state.srcImage,0,0),this.cv.imread(a)):null}showImage(a){const t=this.container.querySelector(".canvas-wrapper");if(!t)return;const e=new Image;e.onload=()=>{var s;t.innerHTML="";const i=document.createElement("canvas");i.width=e.width,i.height=e.height,(s=i.getContext("2d"))==null||s.drawImage(e,0,0),i.style.maxWidth="100%",i.style.borderRadius="8px",t.appendChild(i)},e.src=a.toDataURL()}updateResult(a){const t=this.container.querySelector(".result-canvas-wrapper");if(!t||!a)return;const e=document.createElement("canvas");e.width=a.cols,e.height=a.rows,this.cv.imshow(e,a),e.style.maxWidth="100%",e.style.borderRadius="8px",t.innerHTML="",t.appendChild(e),window.currentResultCanvas=e}getResultCanvas(){return window.currentResultCanvas||null}}class u{constructor(a,t){o(this,"container");o(this,"onImageLoaded");o(this,"previewCanvas",null);this.container=a,this.onImageLoaded=t}render(){this.container.innerHTML=`
      <div class="upload-zone" id="uploadZone">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17,8 12,3 7,8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p>拖拽图片到此处，或<strong style="color: var(--accent)">点击上传</strong></p>
        <p class="hint">支持 JPG、PNG、WebP 格式</p>
        <input type="file" id="fileInput" accept="image/*" class="hidden-input">
      </div>
    `;const a=document.getElementById("uploadZone"),t=document.getElementById("fileInput");a&&t&&(a.addEventListener("click",()=>t.click()),a.addEventListener("dragover",e=>{e.preventDefault(),a.classList.add("dragover")}),a.addEventListener("dragleave",()=>{a.classList.remove("dragover")}),a.addEventListener("drop",e=>{var s;e.preventDefault(),a.classList.remove("dragover");const i=(s=e.dataTransfer)==null?void 0:s.files[0];i&&i.type.startsWith("image/")&&this.loadImage(i)}),t.addEventListener("change",()=>{var i;const e=(i=t.files)==null?void 0:i[0];e&&this.loadImage(e)}))}loadImage(a){const t=new FileReader;t.onload=e=>{var s;const i=new Image;i.onload=()=>{this.onImageLoaded(i)},i.src=(s=e.target)==null?void 0:s.result},t.readAsDataURL(a)}showPreview(a){var s;const t=document.getElementById("uploadZone");if(!t)return;this.previewCanvas=document.createElement("canvas"),this.previewCanvas.width=a.width,this.previewCanvas.height=a.height;const e=this.previewCanvas.getContext("2d");e&&e.drawImage(a,0,0),t.innerHTML="",t.style.padding="0",t.style.border="none";const i=document.createElement("div");i.style.cssText="position: relative; display: inline-block;",i.innerHTML=`
      <img src="${this.previewCanvas.toDataURL()}" style="max-width: 100%; display: block; border-radius: 8px;">
      <button class="btn btn-secondary" id="changeImageBtn" style="position: absolute; bottom: 12px; right: 12px; padding: 6px 12px; font-size: 12px;">
        更换图片
      </button>
    `,t.appendChild(i),(s=document.getElementById("changeImageBtn"))==null||s.addEventListener("click",n=>{n.stopPropagation(),this.render()})}}class z extends h{constructor(t,e){super(t,e);o(this,"uploader");this.uploader=new u(t,this.onImageLoaded.bind(this))}render(){var e;this.container.innerHTML=`
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
    `,document.getElementById("uploadContainer")&&this.uploader.render(),(e=document.getElementById("processBtn"))==null||e.addEventListener("click",()=>{var i;(i=window.switchPage)==null||i.call(window,"grayscale")})}onImageLoaded(t){var s;this.state.srcImage=t;const e=document.getElementById("previewSection"),i=this.container.querySelector(".canvas-wrapper");if(e&&i){e.style.display="block";const n=document.createElement("canvas");n.width=t.width,n.height=t.height,(s=n.getContext("2d"))==null||s.drawImage(t,0,0),n.style.maxWidth="100%",n.style.borderRadius="8px",i.innerHTML="",i.appendChild(n),this.uploader.showPreview(t)}}}function c(l,a,t,e,i=1,s){const n=document.createElement("div");n.className="slider-group",n.innerHTML=`
    <div class="slider-header">
      <span class="slider-label">${l}</span>
      <span class="slider-value" id="valueDisplay">${e}</span>
    </div>
    <input type="range" min="${a}" max="${t}" value="${e}" step="${i}">
  `;const r=n.querySelector("input"),d=n.querySelector("#valueDisplay");return r.addEventListener("input",()=>{const v=parseFloat(r.value);d.textContent=String(v),s(v)}),n}function g(l){const a=document.createElement("div");return a.className="btn-group",l.forEach(t=>{const e=document.createElement("button");e.className=`btn btn-secondary${t.active?" active":""}`,e.textContent=t.label,e.addEventListener("click",()=>{a.querySelectorAll("button").forEach(i=>i.classList.remove("active")),e.classList.add("active"),t.onClick()}),a.appendChild(e)}),a}class P extends h{constructor(t,e){super(t,e);o(this,"uploader");o(this,"brightness",0);o(this,"contrast",1);this.uploader=new u(t,this.onImageLoaded.bind(this))}render(){this.container.innerHTML=`
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
    `,document.getElementById("uploadContainer")&&this.uploader.render(),this.setupControls(),this.bindEvents()}setupControls(){const t=document.getElementById("slidersContainer");t&&(t.appendChild(c("亮度",-100,100,0,1,e=>{this.brightness=e})),t.appendChild(c("对比度",.1,3,1,.1,e=>{this.contrast=e})))}bindEvents(){var t,e,i;(t=document.getElementById("applyBtn"))==null||t.addEventListener("click",()=>this.applyEffect()),(e=document.getElementById("resetBtn"))==null||e.addEventListener("click",()=>this.reset()),(i=document.getElementById("downloadBtn"))==null||i.addEventListener("click",()=>this.download())}onImageLoaded(t){this.state.srcImage=t,this.uploader.showPreview(t);const e=document.getElementById("controlsSection");e&&(e.style.display="block")}applyEffect(){if(!this.state.srcImage)return;const t=this.getSrcMat();if(!t)return;const e=new this.cv.Mat;this.cv.cvtColor(t,e,this.cv.COLOR_RGBA2GRAY);const i=new this.cv.Mat;e.convertTo(i,-1,this.contrast,this.brightness);const s=this.container.querySelector(".result-canvas-wrapper");if(s){const d=document.createElement("canvas");d.width=t.cols,d.height=t.rows,this.cv.imshow(d,t),d.style.maxWidth="100%",d.style.display="block",s.innerHTML="",s.appendChild(d)}const n=document.getElementById("effectCanvasWrapper");if(n){const d=document.createElement("canvas");d.width=i.cols,d.height=i.rows,this.cv.imshow(d,i),d.style.maxWidth="100%",d.style.display="block",n.innerHTML="",n.appendChild(d),window.currentResultCanvas=d}const r=document.getElementById("resultSection");r&&(r.style.display="block"),t.delete(),e.delete(),i.delete()}reset(){this.brightness=0,this.contrast=1,document.querySelectorAll(".slider-group").forEach((e,i)=>{const s=e.querySelector("input"),n=e.querySelector(".slider-value");s&&n&&(i===0?(s.value="0",n.textContent="0"):(s.value="1",n.textContent="1"))})}download(){const t=this.getResultCanvas();if(t){const e=document.createElement("a");e.download="grayscale_result.png",e.href=t.toDataURL("image/png"),e.click()}}}class O extends h{constructor(t,e){super(t,e);o(this,"uploader");o(this,"blurType","gaussian");o(this,"kernelSize",15);o(this,"sigma",5);this.uploader=new u(t,this.onImageLoaded.bind(this))}render(){this.container.innerHTML=`
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
    `,document.getElementById("uploadContainer")&&this.uploader.render(),this.setupControls()}setupControls(){var e,i,s;const t=document.getElementById("typeButtons");if(t){const n=g([{label:"高斯模糊",active:!0,onClick:()=>{this.blurType="gaussian",this.updateSliders()}},{label:"均值模糊",onClick:()=>{this.blurType="blur",this.updateSliders()}},{label:"中值滤波",onClick:()=>{this.blurType="median",this.updateSliders()}},{label:"双边滤波",onClick:()=>{this.blurType="bilateral",this.updateSliders()}}]);t.appendChild(n)}this.createSliders(),(e=document.getElementById("applyBtn"))==null||e.addEventListener("click",()=>this.applyEffect()),(i=document.getElementById("resetBtn"))==null||i.addEventListener("click",()=>this.reset()),(s=document.getElementById("downloadBtn"))==null||s.addEventListener("click",()=>this.download())}createSliders(){const t=document.getElementById("slidersContainer");t&&(t.innerHTML="",t.appendChild(c("核大小",3,51,this.kernelSize,2,e=>{this.kernelSize=e})),(this.blurType==="gaussian"||this.blurType==="bilateral")&&t.appendChild(c("Sigma",.1,30,this.sigma,.5,e=>{this.sigma=e})))}updateSliders(){this.createSliders()}onImageLoaded(t){this.state.srcImage=t,this.uploader.showPreview(t);const e=document.getElementById("controlsSection");e&&(e.style.display="block")}applyEffect(){if(!this.state.srcImage)return;const t=this.getSrcMat();if(!t)return;const e=new this.cv.Mat,i=new this.cv.Size(this.kernelSize,this.kernelSize);switch(this.blurType){case"gaussian":this.cv.GaussianBlur(t,e,i,this.sigma);break;case"blur":this.cv.blur(t,e,i);break;case"median":this.cv.medianBlur(t,e,this.kernelSize);break;case"bilateral":this.cv.bilateralFilter(t,e,this.kernelSize,this.sigma,this.sigma);break}const s=document.getElementById("effectCanvasWrapper");if(s){const r=document.createElement("canvas");r.width=e.cols,r.height=e.rows,this.cv.imshow(r,e),r.style.maxWidth="100%",s.innerHTML="",s.appendChild(r),window.currentResultCanvas=r}const n=document.getElementById("resultSection");n&&(n.style.display="block"),t.delete(),e.delete()}reset(){this.kernelSize=15,this.sigma=5,this.updateSliders()}download(){const t=this.getResultCanvas();if(t){const e=document.createElement("a");e.download="blur_result.png",e.href=t.toDataURL("image/png"),e.click()}}}class W extends h{constructor(t,e){super(t,e);o(this,"uploader");o(this,"edgeType","canny");o(this,"threshold1",100);o(this,"threshold2",200);o(this,"apertureSize",3);this.uploader=new u(t,this.onImageLoaded.bind(this))}render(){this.container.innerHTML=`
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
    `,document.getElementById("uploadContainer")&&this.uploader.render(),this.setupControls()}setupControls(){var e,i,s;const t=document.getElementById("typeButtons");if(t){const n=g([{label:"Canny",active:!0,onClick:()=>{this.edgeType="canny",this.updateSliders()}},{label:"Sobel",onClick:()=>{this.edgeType="sobel",this.updateSliders()}},{label:"Laplacian",onClick:()=>{this.edgeType="laplacian",this.updateSliders()}}]);t.appendChild(n)}this.createSliders(),(e=document.getElementById("applyBtn"))==null||e.addEventListener("click",()=>this.applyEffect()),(i=document.getElementById("resetBtn"))==null||i.addEventListener("click",()=>this.reset()),(s=document.getElementById("downloadBtn"))==null||s.addEventListener("click",()=>this.download())}createSliders(){const t=document.getElementById("slidersContainer");t&&(t.innerHTML="",this.edgeType==="canny"?(t.appendChild(c("阈值1",0,300,this.threshold1,1,e=>{this.threshold1=e})),t.appendChild(c("阈值2",0,300,this.threshold2,1,e=>{this.threshold2=e}))):this.edgeType==="sobel"?t.appendChild(c("阈值",0,300,100,1,e=>{this.threshold1=e})):this.edgeType==="laplacian"&&(t.appendChild(c("核大小",1,7,3,2,e=>{this.apertureSize=e})),t.appendChild(c("阈值",0,300,100,1,e=>{this.threshold1=e}))))}updateSliders(){this.createSliders()}onImageLoaded(t){this.state.srcImage=t,this.uploader.showPreview(t);const e=document.getElementById("controlsSection");e&&(e.style.display="block")}applyEffect(){if(!this.state.srcImage)return;const t=this.getSrcMat();if(!t)return;const e=new this.cv.Mat;this.cv.cvtColor(t,e,this.cv.COLOR_RGBA2GRAY);const i=new this.cv.Mat;if(this.edgeType==="canny")this.cv.Canny(e,i,this.threshold1,this.threshold2);else if(this.edgeType==="sobel"){const r=new this.cv.Mat,d=new this.cv.Mat;this.cv.Sobel(e,r,this.cv.CV_16S,1,0,this.apertureSize),this.cv.Sobel(e,d,this.cv.CV_16S,0,1,this.apertureSize),this.cv.convertScaleAbs(r,r),this.cv.convertScaleAbs(d,d),this.cv.addWeighted(r,.5,d,.5,0,i),r.delete(),d.delete()}else if(this.edgeType==="laplacian"){const r=new this.cv.Mat;this.cv.Laplacian(e,r,this.cv.CV_16S,this.apertureSize),this.cv.convertScaleAbs(r,i),r.delete()}const s=document.getElementById("effectCanvasWrapper");if(s){const r=document.createElement("canvas");r.width=i.cols,r.height=i.rows,this.cv.imshow(r,i),r.style.maxWidth="100%",s.innerHTML="",s.appendChild(r),window.currentResultCanvas=r}const n=document.getElementById("resultSection");n&&(n.style.display="block"),t.delete(),e.delete(),i.delete()}reset(){this.threshold1=100,this.threshold2=200,this.apertureSize=3,this.updateSliders()}download(){const t=this.getResultCanvas();if(t){const e=document.createElement("a");e.download="edge_result.png",e.href=t.toDataURL("image/png"),e.click()}}}class A extends h{constructor(t,e){super(t,e);o(this,"uploader");o(this,"morphType","erode");o(this,"kernelSize",5);o(this,"iterations",1);this.uploader=new u(t,this.onImageLoaded.bind(this))}render(){this.container.innerHTML=`
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
    `,document.getElementById("uploadContainer")&&this.uploader.render(),this.setupControls()}setupControls(){var i,s,n;const t=document.getElementById("typeButtons");if(t){const r=g([{label:"腐蚀",active:!0,onClick:()=>{this.morphType="erode"}},{label:"膨胀",onClick:()=>{this.morphType="dilate"}},{label:"开运算",onClick:()=>{this.morphType="open"}},{label:"闭运算",onClick:()=>{this.morphType="close"}}]);t.appendChild(r)}const e=document.getElementById("slidersContainer");e&&(e.innerHTML="",e.appendChild(c("核大小",3,21,this.kernelSize,2,r=>{this.kernelSize=r})),e.appendChild(c("迭代次数",1,10,this.iterations,1,r=>{this.iterations=r}))),(i=document.getElementById("applyBtn"))==null||i.addEventListener("click",()=>this.applyEffect()),(s=document.getElementById("resetBtn"))==null||s.addEventListener("click",()=>this.reset()),(n=document.getElementById("downloadBtn"))==null||n.addEventListener("click",()=>this.download())}onImageLoaded(t){this.state.srcImage=t,this.uploader.showPreview(t);const e=document.getElementById("controlsSection");e&&(e.style.display="block")}applyEffect(){if(!this.state.srcImage)return;const t=this.getSrcMat();if(!t)return;const e=new this.cv.Mat,i=this.cv.getStructuringElement(this.cv.MORPH_RECT,new this.cv.Size(this.kernelSize,this.kernelSize));switch(this.morphType){case"erode":this.cv.erode(t,e,i,{iterations:this.iterations});break;case"dilate":this.cv.dilate(t,e,i,{iterations:this.iterations});break;case"open":this.cv.morphologyEx(t,e,this.cv.MORPH_OPEN,i,{iterations:this.iterations});break;case"close":this.cv.morphologyEx(t,e,this.cv.MORPH_CLOSE,i,{iterations:this.iterations});break}const s=document.getElementById("effectCanvasWrapper");if(s){const r=document.createElement("canvas");r.width=e.cols,r.height=e.rows,this.cv.imshow(r,e),r.style.maxWidth="100%",s.innerHTML="",s.appendChild(r),window.currentResultCanvas=r}const n=document.getElementById("resultSection");n&&(n.style.display="block"),t.delete(),i.delete(),e.delete()}reset(){this.kernelSize=5,this.iterations=1,this.updateSliders()}updateSliders(){document.querySelectorAll(".slider-group").forEach((e,i)=>{const s=e.querySelector("input"),n=e.querySelector(".slider-value");s&&n&&(i===0?(s.value="5",n.textContent="5"):(s.value="1",n.textContent="1"))})}download(){const t=this.getResultCanvas();if(t){const e=document.createElement("a");e.download="morphology_result.png",e.href=t.toDataURL("image/png"),e.click()}}}class D extends h{constructor(t,e){super(t,e);o(this,"uploader");o(this,"targetSpace","hsv");o(this,"hueShift",0);o(this,"saturationScale",1);o(this,"valueScale",1);this.uploader=new u(t,this.onImageLoaded.bind(this))}render(){this.container.innerHTML=`
      <h2 class="page-title">颜色空间</h2>
      <p class="page-desc">在 RGB、HSV、LAB 等颜色空间之间转换和调整</p>

      <div class="card">
        <div class="card-title">上传图片</div>
        <div id="uploadContainer" style="min-height: 150px;"></div>
      </div>

      <div id="controlsSection" class="card" style="margin-top: 20px; display: none;">
        <div class="card-title">参数调整</div>
        <div style="margin-bottom: 20px;">
          <div class="slider-label" style="margin-bottom: 8px;">目标颜色空间</div>
          <div id="spaceButtons"></div>
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
    `,document.getElementById("uploadContainer")&&this.uploader.render(),this.setupControls()}setupControls(){var e,i,s;const t=document.getElementById("spaceButtons");if(t){const n=g([{label:"HSV",active:!0,onClick:()=>{this.targetSpace="hsv",this.updateSliders()}},{label:"LAB",onClick:()=>{this.targetSpace="lab",this.updateSliders()}},{label:"YCrCb",onClick:()=>{this.targetSpace="ycrcb",this.updateSliders()}}]);t.appendChild(n)}this.createSliders(),(e=document.getElementById("applyBtn"))==null||e.addEventListener("click",()=>this.applyEffect()),(i=document.getElementById("resetBtn"))==null||i.addEventListener("click",()=>this.reset()),(s=document.getElementById("downloadBtn"))==null||s.addEventListener("click",()=>this.download())}createSliders(){const t=document.getElementById("slidersContainer");t&&(t.innerHTML="",this.targetSpace==="hsv"?(t.appendChild(c("色相偏移",-180,180,0,1,e=>{this.hueShift=e})),t.appendChild(c("饱和度",0,2,1,.1,e=>{this.saturationScale=e})),t.appendChild(c("亮度",0,2,1,.1,e=>{this.valueScale=e}))):this.targetSpace==="lab"?(t.appendChild(c("L 通道",0,2,1,.1,e=>{this.valueScale=e})),t.appendChild(c("a 通道",.5,1.5,1,.1,e=>{this.saturationScale=e})),t.appendChild(c("b 通道",.5,1.5,1,.1,e=>{this.hueShift=e}))):this.targetSpace==="ycrcb"&&(t.appendChild(c("Y 通道",0,2,1,.1,e=>{this.valueScale=e})),t.appendChild(c("Cr 通道",.5,1.5,1,.1,e=>{this.saturationScale=e})),t.appendChild(c("Cb 通道",.5,1.5,1,.1,e=>{this.hueShift=e}))))}updateSliders(){this.createSliders()}onImageLoaded(t){this.state.srcImage=t,this.uploader.showPreview(t);const e=document.getElementById("controlsSection");e&&(e.style.display="block")}applyEffect(){if(!this.state.srcImage)return;const t=this.getSrcMat();if(!t)return;const e=new this.cv.Mat;if(this.targetSpace==="hsv"){const n=new this.cv.Mat;this.cv.cvtColor(t,n,this.cv.COLOR_RGBA2RGB),this.cv.cvtColor(n,n,this.cv.COLOR_RGB2HSV);const r=new this.cv.MatVector;this.cv.split(n,r),this.hueShift!==0&&r.get(0).convertTo(r.get(0),-1,1,this.hueShift),this.saturationScale!==1&&r.get(1).convertTo(r.get(1),-1,this.saturationScale,0),this.valueScale!==1&&r.get(2).convertTo(r.get(2),-1,this.valueScale,0),this.cv.merge(r,n),this.cv.cvtColor(n,e,this.cv.COLOR_HSV2RGB),n.delete(),r.delete()}else this.targetSpace==="lab"?this.cv.cvtColor(t,e,this.cv.COLOR_RGB2Lab):this.targetSpace==="ycrcb"&&this.cv.cvtColor(t,e,this.cv.COLOR_RGB2YCrCb);const i=document.getElementById("effectCanvasWrapper");if(i){const n=document.createElement("canvas");n.width=e.cols,n.height=e.rows,this.cv.imshow(n,e),n.style.maxWidth="100%",i.innerHTML="",i.appendChild(n),window.currentResultCanvas=n}const s=document.getElementById("resultSection");s&&(s.style.display="block"),t.delete(),e.delete()}reset(){this.hueShift=0,this.saturationScale=1,this.valueScale=1,this.updateSliders()}download(){const t=this.getResultCanvas();if(t){const e=document.createElement("a");e.download="colorspace_result.png",e.href=t.toDataURL("image/png"),e.click()}}}class V extends h{constructor(t,e){super(t,e);o(this,"uploader");o(this,"transformType","resize");o(this,"scale",1);o(this,"angle",0);o(this,"flipCode",0);this.uploader=new u(t,this.onImageLoaded.bind(this))}render(){this.container.innerHTML=`
      <h2 class="page-title">图像变换</h2>
      <p class="page-desc">缩放、旋转、翻转等几何变换</p>

      <div class="card">
        <div class="card-title">上传图片</div>
        <div id="uploadContainer" style="min-height: 150px;"></div>
      </div>

      <div id="controlsSection" class="card" style="margin-top: 20px; display: none;">
        <div class="card-title">参数调整</div>
        <div style="margin-bottom: 20px;">
          <div class="slider-label" style="margin-bottom: 8px;">变换类型</div>
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
    `,document.getElementById("uploadContainer")&&this.uploader.render(),this.setupControls()}setupControls(){var e,i,s;const t=document.getElementById("typeButtons");if(t){const n=g([{label:"缩放",active:!0,onClick:()=>{this.transformType="resize",this.updateSliders()}},{label:"旋转",onClick:()=>{this.transformType="rotate",this.updateSliders()}},{label:"翻转",onClick:()=>{this.transformType="flip",this.updateSliders()}}]);t.appendChild(n)}this.createSliders(),(e=document.getElementById("applyBtn"))==null||e.addEventListener("click",()=>this.applyEffect()),(i=document.getElementById("resetBtn"))==null||i.addEventListener("click",()=>this.reset()),(s=document.getElementById("downloadBtn"))==null||s.addEventListener("click",()=>this.download())}createSliders(){const t=document.getElementById("slidersContainer");if(t){if(t.innerHTML="",this.transformType==="resize")t.appendChild(c("缩放比例",.1,3,1,.1,e=>{this.scale=e}));else if(this.transformType==="rotate")t.appendChild(c("旋转角度",-180,180,0,1,e=>{this.angle=e}));else if(this.transformType==="flip"){const e=document.createElement("div");e.style.cssText="display: flex; gap: 12px;",e.innerHTML=`
        <button class="btn btn-secondary${this.flipCode===0?" active":""}" data-code="0" style="flex: 1;">水平翻转</button>
        <button class="btn btn-secondary${this.flipCode===1?" active":""}" data-code="1" style="flex: 1;">垂直翻转</button>
        <button class="btn btn-secondary${this.flipCode===-1?" active":""}" data-code="-1" style="flex: 1;">双向翻转</button>
      `,e.querySelectorAll("button").forEach(i=>{i.addEventListener("click",()=>{e.querySelectorAll("button").forEach(s=>s.classList.remove("active")),i.classList.add("active"),this.flipCode=parseInt(i.getAttribute("data-code")||"0")})}),t.appendChild(e)}}}updateSliders(){this.createSliders()}onImageLoaded(t){this.state.srcImage=t,this.uploader.showPreview(t);const e=document.getElementById("controlsSection");e&&(e.style.display="block")}applyEffect(){if(!this.state.srcImage)return;const t=this.getSrcMat();if(!t)return;const e=new this.cv.Mat;if(this.transformType==="resize"){const n=Math.round(t.cols*this.scale),r=Math.round(t.rows*this.scale);this.cv.resize(t,e,new this.cv.Size(n,r),0,0,this.cv.INTER_LINEAR)}else if(this.transformType==="rotate"){const n=new this.cv.Point(t.cols/2,t.rows/2),r=this.cv.getRotationMatrix2D(n,this.angle,1);this.cv.warpAffine(t,e,r,new this.cv.Size(t.cols,t.rows)),r.delete()}else this.transformType==="flip"&&this.cv.flip(t,e,this.flipCode);const i=document.getElementById("effectCanvasWrapper");if(i){const n=document.createElement("canvas");n.width=e.cols,n.height=e.rows,this.cv.imshow(n,e),n.style.maxWidth="100%",i.innerHTML="",i.appendChild(n),window.currentResultCanvas=n}const s=document.getElementById("resultSection");s&&(s.style.display="block"),t.delete(),e.delete()}reset(){this.scale=1,this.angle=0,this.flipCode=0,this.updateSliders()}download(){const t=this.getResultCanvas();if(t){const e=document.createElement("a");e.download="transform_result.png",e.href=t.toDataURL("image/png"),e.click()}}}class _ extends h{constructor(t,e){super(t,e);o(this,"uploader");o(this,"currentTool","rect");o(this,"currentColor","#00d4ff");o(this,"lineThickness",2);o(this,"isDrawing",!1);o(this,"startX",0);o(this,"startY",0);o(this,"previewCanvas",null);o(this,"previewCtx",null);this.uploader=new u(t,this.onImageLoaded.bind(this))}render(){this.container.innerHTML=`
      <h2 class="page-title">绘制工具</h2>
      <p class="page-desc">在图像上绘制矩形、圆形、线条和文字</p>

      <div class="card">
        <div class="card-title">上传图片</div>
        <div id="uploadContainer" style="min-height: 150px;"></div>
      </div>

      <div id="controlsSection" class="card" style="margin-top: 20px; display: none;">
        <div class="card-title">绘制工具</div>
        <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px;">
          <div id="toolButtons"></div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--text-secondary); font-size: 13px;">颜色:</span>
            <input type="color" id="colorPicker" value="${this.currentColor}">
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--text-secondary); font-size: 13px;">线宽:</span>
            <select id="thicknessSelect" style="padding: 6px 10px;">
              <option value="1">1px</option>
              <option value="2" selected>2px</option>
              <option value="4">4px</option>
              <option value="6">6px</option>
              <option value="8">8px</option>
            </select>
          </div>
        </div>
        <div id="textInputContainer" style="display: none; margin-bottom: 20px;">
          <input type="text" id="textInput" placeholder="输入文字" style="background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; color: var(--text-primary); font-size: 14px; width: 200px;">
        </div>
        <div class="btn-group">
          <button class="btn btn-primary" id="applyBtn">应用绘制</button>
          <button class="btn btn-secondary" id="clearBtn">清除</button>
          <button class="btn btn-secondary" id="downloadBtn">下载图片</button>
        </div>
      </div>

      <div id="canvasSection" class="card" style="margin-top: 20px; display: none;">
        <div class="card-title">画布</div>
        <div id="canvasContainer" style="background: var(--bg-tertiary); border-radius: 8px; overflow: auto; max-height: 60vh; display: flex; justify-content: center; padding: 20px;"></div>
      </div>
    `,document.getElementById("uploadContainer")&&this.uploader.render(),this.setupControls()}setupControls(){var s,n,r;const t=document.getElementById("toolButtons");if(t){const d=g([{label:"矩形",active:!0,onClick:()=>{this.currentTool="rect",this.showTextInput(!1)}},{label:"圆形",onClick:()=>{this.currentTool="circle",this.showTextInput(!1)}},{label:"线条",onClick:()=>{this.currentTool="line",this.showTextInput(!1)}},{label:"文字",onClick:()=>{this.currentTool="text",this.showTextInput(!0)}}]);t.appendChild(d)}const e=document.getElementById("colorPicker");e&&e.addEventListener("input",()=>{this.currentColor=e.value});const i=document.getElementById("thicknessSelect");i&&i.addEventListener("change",()=>{this.lineThickness=parseInt(i.value)}),(s=document.getElementById("applyBtn"))==null||s.addEventListener("click",()=>this.applyDrawing()),(n=document.getElementById("clearBtn"))==null||n.addEventListener("click",()=>this.clearCanvas()),(r=document.getElementById("downloadBtn"))==null||r.addEventListener("click",()=>this.download())}showTextInput(t){const e=document.getElementById("textInputContainer");e&&(e.style.display=t?"block":"none")}onImageLoaded(t){this.state.srcImage=t,this.uploader.showPreview(t);const e=document.getElementById("controlsSection"),i=document.getElementById("canvasSection"),s=document.getElementById("canvasContainer");if(e&&(e.style.display="block"),i&&(i.style.display="block"),s){s.innerHTML="";const n=document.createElement("canvas");n.width=t.width,n.height=t.height;const r=n.getContext("2d");r&&r.drawImage(t,0,0),this.previewCanvas=n,this.previewCtx=r,this.setupCanvasEvents(n),n.style.cursor="crosshair",s.appendChild(n)}}setupCanvasEvents(t){t.addEventListener("mousedown",e=>{this.isDrawing=!0;const i=t.getBoundingClientRect(),s=t.width/i.width,n=t.height/i.height;this.startX=(e.clientX-i.left)*s,this.startY=(e.clientY-i.top)*n}),t.addEventListener("mousemove",e=>{if(!this.isDrawing||!this.previewCtx)return;const i=t.getBoundingClientRect(),s=t.width/i.width,n=t.height/i.height,r=(e.clientX-i.left)*s,d=(e.clientY-i.top)*n;if(this.state.srcImage&&(this.previewCtx.clearRect(0,0,t.width,t.height),this.previewCtx.drawImage(this.state.srcImage,0,0)),this.previewCtx.strokeStyle=this.currentColor,this.previewCtx.lineWidth=this.lineThickness,this.previewCtx.fillStyle=this.currentColor,this.currentTool==="rect"){const v=r-this.startX,E=d-this.startY;this.previewCtx.strokeRect(this.startX,this.startY,v,E)}else if(this.currentTool==="circle"){const v=Math.sqrt(Math.pow(r-this.startX,2)+Math.pow(d-this.startY,2));this.previewCtx.beginPath(),this.previewCtx.arc(this.startX,this.startY,v,0,Math.PI*2),this.previewCtx.stroke()}else this.currentTool==="line"&&(this.previewCtx.beginPath(),this.previewCtx.moveTo(this.startX,this.startY),this.previewCtx.lineTo(r,d),this.previewCtx.stroke())}),t.addEventListener("mouseup",()=>{if(this.isDrawing&&(this.isDrawing=!1,this.currentTool==="text")){const e=document.getElementById("textInput"),i=(e==null?void 0:e.value)||"Text";this.previewCtx.font=`${this.lineThickness*10}px Arial`,this.previewCtx.fillText(i,this.startX,this.startY)}}),t.addEventListener("mouseleave",()=>{this.isDrawing=!1})}applyDrawing(){window.currentResultCanvas=this.previewCanvas}clearCanvas(){!this.previewCanvas||!this.previewCtx||!this.state.srcImage||(this.previewCtx.clearRect(0,0,this.previewCanvas.width,this.previewCanvas.height),this.previewCtx.drawImage(this.state.srcImage,0,0))}download(){if(this.previewCanvas){const t=document.createElement("a");t.download="drawn_image.png",t.href=this.previewCanvas.toDataURL("image/png"),t.click()}}}const p={currentPage:"home",srcImage:null,originalMat:null},C={home:{render:l=>new z(l,p).render()},grayscale:{render:l=>new P(l,p).render()},blur:{render:l=>new O(l,p).render()},edge:{render:l=>new W(l,p).render()},morphology:{render:l=>new A(l,p).render()},colorspace:{render:l=>new D(l,p).render()},transform:{render:l=>new V(l,p).render()},draw:{render:l=>new _(l,p).render()}};function f(l){if(!C[l])return;p.currentPage=l;const a=document.querySelector(".content");a&&(a.innerHTML="",C[l].render(a)),S(l)}async function y(l="auto"){var t,e;const a=document.getElementById("app");if(a){l==="auto"?a.innerHTML=`
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
    `:a.innerHTML=`
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在加载 ${l==="local"?"本地":"CDN"} OpenCV.js...</div>
        <div class="loading-progress-bar">
          <div class="loading-progress-fill" id="progressFill"></div>
        </div>
      </div>
    `,l==="auto"&&((t=document.getElementById("useLocalBtn"))==null||t.addEventListener("click",()=>y("local")),(e=document.getElementById("useCdnBtn"))==null||e.addEventListener("click",()=>y("cdn")));try{l==="local"?b(!0):l==="cdn"&&b(!1),await T(i=>{const s=document.getElementById("progressFill");s&&(s.style.width=`${i}%`)}),console.log("OpenCV.js 加载成功"),a.innerHTML=`
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
    `,H("navMenu",f),f("home")}catch(i){l==="auto"||l==="cdn"?(a.innerHTML=`
        <div class="loading-overlay">
          <div class="loading-text" style="color: var(--danger)">CDN 加载失败</div>
          <div class="loading-text" style="margin-top: 10px;">正在尝试本地版本...</div>
        </div>
      `,setTimeout(()=>y("local"),1e3)):(a.innerHTML=`
        <div class="loading-overlay">
          <div class="loading-text" style="color: var(--danger)">OpenCV.js 加载失败</div>
          <div class="loading-text" style="margin-top: 10px; font-size: 12px;">请确保已下载 OpenCV.js 到 public/opencv/ 目录</div>
          <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px">重试</button>
        </div>
      `,console.error("OpenCV 加载失败:",i))}}}window.appState=p;window.switchPage=f;window.initApp=y;y();
