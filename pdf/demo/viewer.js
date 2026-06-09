(function () {
  const pdfjsLib = window["pdfjs-dist/build/pdf"];
  const PDFLib = window.PDFLib;

  if (!pdfjsLib) {
    setBootError("PDF.js 加载失败，请检查网络连接。");
    return;
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const fileInput = document.querySelector("#fileInput");
  const dropZone = document.querySelector("#dropZone");
  const canvas = document.querySelector("#pdfCanvas");
  const context = canvas.getContext("2d");
  const secondCanvas = document.querySelector("#secondPdfCanvas");
  const secondContext = secondCanvas.getContext("2d");
  const continuousPages = document.querySelector("#continuousPages");
  const annotationLayer = document.querySelector("#annotationLayer");
  const emptyState = document.querySelector("#emptyState");
  const statusEl = document.querySelector("#status");
  const prevPageBtn = document.querySelector("#prevPage");
  const nextPageBtn = document.querySelector("#nextPage");
  const pageInput = document.querySelector("#pageInput");
  const pageCount = document.querySelector("#pageCount");
  const zoomOutBtn = document.querySelector("#zoomOut");
  const zoomInBtn = document.querySelector("#zoomIn");
  const fitWidthBtn = document.querySelector("#fitWidth");
  const readerFocusBtn = document.querySelector("#readerFocus");
  const zoomLabel = document.querySelector("#zoomLabel");
  const addBookmarkBtn = document.querySelector("#addBookmark");
  const bookmarkTitle = document.querySelector("#bookmarkTitle");
  const bookmarksList = document.querySelector("#bookmarksList");
  const toolSelect = document.querySelector("#toolSelect");
  const toggleTextBtn = document.querySelector("#toggleText");
  const textPanel = document.querySelector("#textPanel");
  const pageText = document.querySelector("#pageText");
  const copyTextBtn = document.querySelector("#copyText");
  const noteInput = document.querySelector("#noteInput");
  const quickNoteBtn = document.querySelector("#quickNote");
  const notesList = document.querySelector("#notesList");
  const exportDataBtn = document.querySelector("#exportData");
  const importDataInput = document.querySelector("#importData");
  const exportPdfBtn = document.querySelector("#exportPdf");
  const undoBtn = document.querySelector("#undoBtn");
  const redoBtn = document.querySelector("#redoBtn");
  const signatureInput = document.querySelector("#signatureInput");
  const textBoxInput = document.querySelector("#textBoxInput");
  const quickTextBoxBtn = document.querySelector("#quickTextBox");
  const searchInput = document.querySelector("#searchInput");
  const searchBtn = document.querySelector("#searchBtn");
  const clearSearchBtn = document.querySelector("#clearSearch");
  const searchResultsEl = document.querySelector("#searchResults");
  const thumbnailList = document.querySelector("#thumbnailList");
  const outlineList = document.querySelector("#outlineList");
  const viewModeSelect = document.querySelector("#viewMode");

  let pdfDocument = null;
  let originalPdfBytes = null;
  let currentPage = 1;
  let scale = 1.2;
  let currentFileName = "";
  let renderTask = null;
  let autoFitMode = true;
  let highlights = [];
  let notes = [];
  let bookmarks = [];
  let textBoxes = [];
  let signatures = [];
  let selectedSignatureDataUrl = "";
  let pageTextCache = new Map();
  let searchResults = [];
  let searchTerm = "";
  let outlineItems = [];
  let undoStack = [];
  let redoStack = [];
  let currentFileKey = "";
  let signatureImageCache = new Map();
  let viewMode = "single";
  let dragEdit = null;
  let highlightDraft = null;
  let dragStart = null;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) openFile(file);
  });

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("is-dragover");
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragover");
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) openFile(file);
  });

  prevPageBtn.addEventListener("click", () => goToPage(currentPage - 1));
  nextPageBtn.addEventListener("click", () => goToPage(currentPage + 1));
  pageInput.addEventListener("change", () => goToPage(Number(pageInput.value)));
  zoomOutBtn.addEventListener("click", () => setScale(scale - 0.2, false));
  zoomInBtn.addEventListener("click", () => setScale(scale + 0.2, false));
  viewModeSelect.addEventListener("change", async () => {
    viewMode = viewModeSelect.value;
    await applyViewMode();
  });

  fitWidthBtn.addEventListener("click", async () => {
    if (!pdfDocument) return;
    autoFitMode = true;
    setScale(await getFitWidthScale(), true);
  });

  readerFocusBtn.addEventListener("click", async () => {
    document.body.classList.toggle("reader-focus");
    readerFocusBtn.textContent = document.body.classList.contains("reader-focus") ? "退出大屏" : "大屏阅读";
    if (pdfDocument) {
      await waitForLayout();
      autoFitMode = true;
      await setScale(await getFitWidthScale(), true);
    }
  });

  toolSelect.addEventListener("change", renderAnnotations);

  toggleTextBtn.addEventListener("click", () => {
    textPanel.classList.toggle("is-hidden");
    document.body.classList.toggle("text-open", !textPanel.classList.contains("is-hidden"));
    toggleTextBtn.textContent = textPanel.classList.contains("is-hidden") ? "显示文本" : "隐藏文本";
    if (pdfDocument && autoFitMode) {
      waitForLayout().then(async () => setScale(await getFitWidthScale(), true));
    }
  });

  copyTextBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pageText.value);
    } catch {
      pageText.select();
      document.execCommand("copy");
    }
    setStatus("当前页文本已复制。");
  });

  addBookmarkBtn.addEventListener("click", addBookmark);
  quickNoteBtn.addEventListener("click", addCenterNote);
  quickTextBoxBtn.addEventListener("click", addCenterTextBox);
  exportDataBtn.addEventListener("click", exportAnnotationData);
  exportPdfBtn.addEventListener("click", exportAnnotatedPdf);
  undoBtn.addEventListener("click", undo);
  redoBtn.addEventListener("click", redo);
  searchBtn.addEventListener("click", runSearch);
  clearSearchBtn.addEventListener("click", clearSearch);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") runSearch();
  });

  signatureInput.addEventListener("change", async () => {
    const file = signatureInput.files && signatureInput.files[0];
    if (!file) return;
    selectedSignatureDataUrl = await fileToDataUrl(file);
    toolSelect.value = "signature";
    renderAnnotations();
    setStatus("签名图片已选择，请在 PDF 页面上点击放置。");
  });

  importDataInput.addEventListener("change", async () => {
    const file = importDataInput.files && importDataInput.files[0];
    if (file) await importAnnotationData(file);
    importDataInput.value = "";
  });

  annotationLayer.addEventListener("click", (event) => {
    if (!pdfDocument || event.target !== annotationLayer) return;
    const point = getRelativePoint(event);
    if (toolSelect.value === "note") addNote(point.x, point.y);
    if (toolSelect.value === "textbox") addTextBox(point.x, point.y);
    if (toolSelect.value === "signature") addSignature(point.x, point.y);
  });

  annotationLayer.addEventListener("mousedown", (event) => {
    if (!pdfDocument || toolSelect.value !== "highlight" || event.target !== annotationLayer) return;
    event.preventDefault();
    dragStart = getRelativePoint(event);
    highlightDraft = document.createElement("div");
    highlightDraft.className = "highlight-box is-draft";
    annotationLayer.append(highlightDraft);
  });

  window.addEventListener("mousemove", (event) => {
    if (dragEdit) {
      updateAnnotationDrag(event);
      return;
    }
    if (!dragStart || !highlightDraft) return;
    const current = getRelativePoint(event);
    drawDraftHighlight(dragStart, current);
  });

  window.addEventListener("mouseup", (event) => {
    if (dragEdit) {
      finishAnnotationDrag();
      return;
    }
    if (!dragStart || !highlightDraft) return;
    const end = getRelativePoint(event);
    const rect = normalizeRect(dragStart, end);
    highlightDraft.remove();
    highlightDraft = null;
    dragStart = null;

    if (rect.width < 0.01 || rect.height < 0.01) return;
    pushHistory();
    highlights.push({ id: createId(), page: currentPage, ...rect });
    renderAnnotations();
    saveLocalState();
    setStatus(`已添加第 ${currentPage} 页高亮。`);
  });

  window.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
      return;
    }
    if (!pdfDocument || [pageInput, pageText, noteInput, textBoxInput, bookmarkTitle, searchInput].includes(event.target)) return;
    if (event.key === "ArrowLeft") goToPage(currentPage - 1);
    if (event.key === "ArrowRight") goToPage(currentPage + 1);
  });

  window.addEventListener("resize", debounce(async () => {
    if (!pdfDocument || !autoFitMode) return;
    await setScale(await getFitWidthScale(), true);
  }, 180));

  updateToolbar();
  renderSideLists();

  async function openFile(file) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setStatus("请选择 PDF 文件。", true);
      return;
    }

    try {
      setStatus(`正在打开：${file.name}`);
      currentFileName = file.name;
      currentPage = 1;
      scale = 1.2;
      autoFitMode = true;
      highlights = [];
      notes = [];
      bookmarks = [];
      textBoxes = [];
      signatures = [];
      searchResults = [];
      searchTerm = "";
      outlineItems = [];
      undoStack = [];
      redoStack = [];
      pageTextCache.clear();
      currentFileKey = buildStorageKey(file);
      pageText.value = "";
      searchInput.value = "";
      thumbnailList.innerHTML = "";
      outlineList.innerHTML = "";
      searchResultsEl.innerHTML = "";
      canvas.classList.remove("has-page");
      annotationLayer.classList.remove("has-page");
      emptyState.classList.add("is-hidden");

      originalPdfBytes = await file.arrayBuffer();
      pdfDocument = await pdfjsLib.getDocument({ data: originalPdfBytes.slice(0) }).promise;

      pageCount.textContent = pdfDocument.numPages;
      pageInput.max = pdfDocument.numPages;
      loadLocalState();
      currentPage = Math.min(Math.max(1, currentPage), pdfDocument.numPages);
      scale = await getFitWidthScale();
      await applyViewMode();
      generateThumbnails();
      buildOutline();
      renderSideLists();
      setStatus(`已打开：${file.name}`);
    } catch (error) {
      console.error(error);
      pdfDocument = null;
      originalPdfBytes = null;
      emptyState.classList.remove("is-hidden");
      canvas.classList.remove("has-page");
      annotationLayer.classList.remove("has-page");
      setStatus(`打开失败：${error.message}`, true);
    } finally {
      updateToolbar();
    }
  }

  async function goToPage(pageNumber) {
    if (!pdfDocument) return;
    const target = Math.min(Math.max(1, Math.trunc(pageNumber || 1)), pdfDocument.numPages);
    if (target === currentPage) {
      pageInput.value = currentPage;
      return;
    }
    currentPage = target;
    if (autoFitMode) {
      scale = await getFitWidthScale();
    }
    await applyViewMode();
    updateToolbar();
    saveLocalState();
    updateThumbnailCurrent();
  }

  async function setScale(nextScale, keepAutoFit = false) {
    if (!pdfDocument) return;
    autoFitMode = keepAutoFit;
    scale = Math.min(Math.max(nextScale, 0.4), 3.5);
    await applyViewMode();
    updateToolbar();
  }

  async function getFitWidthScale() {
    if (!pdfDocument) return scale;
    const page = await pdfDocument.getPage(currentPage);
    const viewport = page.getViewport({ scale: 1 });
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const horizontalPadding = isMobile ? 36 : 72;
    const availableWidth = Math.max(280, dropZone.clientWidth - horizontalPadding);
    const targetScale = availableWidth / viewport.width;
    return Math.min(Math.max(targetScale, 0.45), isMobile ? 2.2 : 2.6);
  }

  async function renderPage(pageNumber) {
    if (!pdfDocument) return;
    if (renderTask) {
      renderTask.cancel();
      renderTask = null;
    }

    setStatus(`正在渲染第 ${pageNumber} 页：${currentFileName}`);

    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const outputScale = window.devicePixelRatio || 1;

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    annotationLayer.style.width = canvas.style.width;
    annotationLayer.style.height = canvas.style.height;

    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    renderTask = page.render({ canvasContext: context, viewport, transform });

    try {
      await renderTask.promise;
      canvas.classList.add("has-page");
      annotationLayer.classList.add("has-page");
      emptyState.classList.add("is-hidden");
      await renderPageText(page);
      renderAnnotations();
      updateThumbnailCurrent();
      setStatus(`第 ${pageNumber} 页渲染完成：${currentFileName}`);
    } catch (error) {
      if (error && error.name === "RenderingCancelledException") return;
      throw error;
    } finally {
      renderTask = null;
    }
  }

  async function applyViewMode() {
    if (!pdfDocument) return;
    saveLocalState();
    dropZone.classList.toggle("is-double", viewMode === "double");
    dropZone.classList.toggle("is-continuous", viewMode === "continuous");
    secondCanvas.classList.remove("has-page");

    if (viewMode === "continuous") {
      await renderContinuousPages();
      await renderPageText(await pdfDocument.getPage(currentPage));
      renderAnnotations();
      updateThumbnailCurrent();
      return;
    }

    continuousPages.innerHTML = "";
    await renderPage(currentPage);
    if (viewMode === "double") {
      await renderSecondPage(currentPage + 1);
    }
  }

  async function renderSecondPage(pageNumber) {
    if (!pdfDocument || pageNumber > pdfDocument.numPages) {
      secondCanvas.classList.remove("has-page");
      return;
    }

    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const outputScale = window.devicePixelRatio || 1;
    secondCanvas.width = Math.floor(viewport.width * outputScale);
    secondCanvas.height = Math.floor(viewport.height * outputScale);
    secondCanvas.style.width = `${Math.floor(viewport.width)}px`;
    secondCanvas.style.height = `${Math.floor(viewport.height)}px`;
    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
    await page.render({ canvasContext: secondContext, viewport, transform }).promise;
    secondCanvas.classList.add("has-page");
  }

  async function renderContinuousPages() {
    continuousPages.innerHTML = "";
    canvas.classList.remove("has-page");
    annotationLayer.classList.remove("has-page");
    secondCanvas.classList.remove("has-page");
    emptyState.classList.add("is-hidden");

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const wrapper = document.createElement("div");
      wrapper.className = "continuous-page";
      wrapper.dataset.page = String(pageNumber);
      wrapper.innerHTML = `<span>第 ${pageNumber} 页</span>`;
      const pageCanvas = document.createElement("canvas");
      wrapper.prepend(pageCanvas);
      continuousPages.append(wrapper);

      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const outputScale = window.devicePixelRatio || 1;
      pageCanvas.width = Math.floor(viewport.width * outputScale);
      pageCanvas.height = Math.floor(viewport.height * outputScale);
      pageCanvas.style.width = `${Math.floor(viewport.width)}px`;
      pageCanvas.style.height = `${Math.floor(viewport.height)}px`;
      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
      await page.render({ canvasContext: pageCanvas.getContext("2d"), viewport, transform }).promise;
      pageCanvas.addEventListener("click", () => {
        currentPage = pageNumber;
        pageInput.value = currentPage;
        saveLocalState();
        updateThumbnailCurrent();
        renderPageText(page);
        setStatus(`当前阅读到第 ${pageNumber} 页。`);
      });
    }

    setStatus("连续滚动模式已渲染完成。");
  }

  async function renderPageText(page) {
    try {
      const data = await getPageTextData(currentPage, page);
      pageText.value = data.text || "当前页没有可复制文本，可能是扫描图片页。";
    } catch (error) {
      console.warn(error);
      pageText.value = "当前页文本提取失败，但页面仍可正常查看。";
    }
  }

  function addNote(x, y) {
    pushHistory();
    const text = noteInput.value.trim() || `第 ${currentPage} 页备注`;
    notes.push({ id: createId(), page: currentPage, x, y, text });
    noteInput.value = "";
    renderAnnotations();
    renderSideLists();
    saveLocalState();
    setStatus(`已添加第 ${currentPage} 页备注。`);
  }

  function addCenterNote() {
    if (!pdfDocument) return;
    addNote(0.5, 0.5);
  }

  function addBookmark() {
    if (!pdfDocument) return;
    pushHistory();
    const title = bookmarkTitle.value.trim() || `第 ${currentPage} 页`;
    bookmarks.push({ id: createId(), page: currentPage, title });
    bookmarkTitle.value = "";
    renderSideLists();
    saveLocalState();
    setStatus(`已添加书签：${title}`);
  }

  function addTextBox(x, y) {
    if (!pdfDocument) return;
    pushHistory();
    const text = textBoxInput.value.trim() || "新文本";
    textBoxes.push({ id: createId(), page: currentPage, x, y, width: 0.24, text });
    textBoxInput.value = "";
    renderAnnotations();
    saveLocalState();
    setStatus(`已添加第 ${currentPage} 页文本框。`);
  }

  function addCenterTextBox() {
    addTextBox(0.5, 0.5);
  }

  function addSignature(x, y) {
    if (!pdfDocument) return;
    if (!selectedSignatureDataUrl) {
      setStatus("请先点击“选择签名”上传图片。", true);
      return;
    }
    pushHistory();
    signatures.push({ id: createId(), page: currentPage, x, y, width: 0.22, dataUrl: selectedSignatureDataUrl });
    renderAnnotations();
    saveLocalState();
    setStatus(`已添加第 ${currentPage} 页签名。`);
  }

  function renderAnnotations() {
    annotationLayer.innerHTML = "";
    annotationLayer.classList.toggle("is-note-tool", ["note", "textbox", "signature"].includes(toolSelect.value));
    annotationLayer.classList.toggle("is-highlight-tool", toolSelect.value === "highlight");

    for (const item of getCurrentSearchBoxes()) {
      const element = document.createElement("div");
      element.className = "search-box";
      element.style.left = `${item.x * 100}%`;
      element.style.top = `${item.y * 100}%`;
      element.style.width = `${item.width * 100}%`;
      element.style.height = `${item.height * 100}%`;
      annotationLayer.append(element);
    }

    for (const item of highlights.filter((highlight) => highlight.page === currentPage)) {
      const element = document.createElement("div");
      element.className = "highlight-box is-draggable-annotation";
      element.title = "拖拽移动，右下角缩放，双击删除高亮";
      element.style.left = `${item.x * 100}%`;
      element.style.top = `${item.y * 100}%`;
      element.style.width = `${item.width * 100}%`;
      element.style.height = `${item.height * 100}%`;
      element.addEventListener("mousedown", (event) => startAnnotationDrag(event, "highlight", item.id, "move"));
      element.addEventListener("dblclick", () => removeItem("highlight", item.id));
      element.append(createResizeHandle("highlight", item.id));
      annotationLayer.append(element);
    }

    for (const item of notes.filter((note) => note.page === currentPage)) {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "note-marker";
      element.textContent = "!";
      element.title = `${item.text}\n拖拽移动，双击删除备注`;
      element.style.left = `${item.x * 100}%`;
      element.style.top = `${item.y * 100}%`;
      element.classList.add("is-draggable-annotation");
      element.addEventListener("mousedown", (event) => startAnnotationDrag(event, "note", item.id, "move"));
      element.addEventListener("click", () => {
        noteInput.value = item.text;
        setStatus(`备注：${item.text}`);
      });
      element.addEventListener("dblclick", () => removeItem("note", item.id));
      annotationLayer.append(element);
    }

    for (const item of textBoxes.filter((box) => box.page === currentPage)) {
      const element = document.createElement("div");
      element.className = "text-box-marker";
      element.textContent = item.text;
      element.title = "拖拽移动，右下角缩放，双击删除文本框";
      element.style.left = `${item.x * 100}%`;
      element.style.top = `${item.y * 100}%`;
      element.style.width = `${item.width * 100}%`;
      element.classList.add("is-draggable-annotation");
      element.addEventListener("mousedown", (event) => startAnnotationDrag(event, "textbox", item.id, "move"));
      element.addEventListener("click", () => {
        textBoxInput.value = item.text;
        setStatus(`文本框：${item.text}`);
      });
      element.addEventListener("dblclick", () => removeItem("textbox", item.id));
      element.append(createResizeHandle("textbox", item.id));
      annotationLayer.append(element);
    }

    for (const item of signatures.filter((signature) => signature.page === currentPage)) {
      const element = document.createElement("div");
      element.className = "signature-marker";
      element.title = "拖拽移动，右下角缩放，双击删除签名";
      element.style.left = `${item.x * 100}%`;
      element.style.top = `${item.y * 100}%`;
      element.style.width = `${item.width * 100}%`;
      element.classList.add("is-draggable-annotation");
      element.addEventListener("mousedown", (event) => startAnnotationDrag(event, "signature", item.id, "move"));
      const image = document.createElement("img");
      image.src = item.dataUrl;
      image.alt = "签名";
      element.append(image);
      element.append(createResizeHandle("signature", item.id));
      element.addEventListener("dblclick", () => removeItem("signature", item.id));
      annotationLayer.append(element);
    }
  }

  function createResizeHandle(type, id) {
    const handle = document.createElement("span");
    handle.className = "annotation-resize-handle";
    handle.addEventListener("mousedown", (event) => startAnnotationDrag(event, type, id, "resize"));
    return handle;
  }

  function renderSideLists() {
    notesList.innerHTML = "";
    bookmarksList.innerHTML = "";

    if (!notes.length) {
      notesList.innerHTML = '<p class="empty-list">暂无备注。</p>';
    } else {
      for (const note of notes) {
        notesList.append(createListItem(`第 ${note.page} 页备注`, note.text, [
          ["跳转", () => goToPage(note.page)],
          ["删除", () => removeItem("note", note.id)],
        ]));
      }
    }

    if (!bookmarks.length) {
      bookmarksList.innerHTML = '<p class="empty-list">暂无书签。</p>';
    } else {
      for (const bookmark of bookmarks) {
        bookmarksList.append(createListItem(bookmark.title, `第 ${bookmark.page} 页`, [
          ["跳转", () => goToPage(bookmark.page)],
          ["删除", () => removeItem("bookmark", bookmark.id)],
        ]));
      }
    }
  }

  function createListItem(title, description, actions) {
    const item = document.createElement("div");
    item.className = "list-item";
    const titleEl = document.createElement("strong");
    titleEl.textContent = title;
    const descEl = document.createElement("p");
    descEl.textContent = description;
    const actionsEl = document.createElement("div");
    actionsEl.className = "item-actions";

    for (const [label, handler] of actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", handler);
      actionsEl.append(button);
    }

    item.append(titleEl, descEl, actionsEl);
    return item;
  }

  function removeItem(type, id) {
    pushHistory();
    if (type === "note") notes = notes.filter((item) => item.id !== id);
    if (type === "highlight") highlights = highlights.filter((item) => item.id !== id);
    if (type === "bookmark") bookmarks = bookmarks.filter((item) => item.id !== id);
    if (type === "textbox") textBoxes = textBoxes.filter((item) => item.id !== id);
    if (type === "signature") signatures = signatures.filter((item) => item.id !== id);
    renderAnnotations();
    renderSideLists();
    saveLocalState();
    setStatus("已删除。");
  }

  function exportAnnotationData() {
    const data = {
      fileName: currentFileName,
      exportedAt: new Date().toISOString(),
      currentPage,
      notes,
      highlights,
      bookmarks,
      textBoxes,
      signatures,
    };
    downloadBlob(JSON.stringify(data, null, 2), buildFileName("annotations", "json"), "application/json");
    setStatus("批注数据已导出。");
  }

  async function importAnnotationData(file) {
    try {
      const data = JSON.parse(await file.text());
      pushHistory();
      notes = Array.isArray(data.notes) ? data.notes : [];
      highlights = Array.isArray(data.highlights) ? data.highlights : [];
      bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];
      textBoxes = Array.isArray(data.textBoxes) ? data.textBoxes : [];
      signatures = Array.isArray(data.signatures) ? data.signatures : [];
      currentPage = Number(data.currentPage) || currentPage;
      if (pdfDocument) currentPage = Math.min(Math.max(1, currentPage), pdfDocument.numPages);
      await renderPage(currentPage);
      renderAnnotations();
      renderSideLists();
      saveLocalState();
      setStatus("批注数据已导入。");
    } catch (error) {
      console.error(error);
      setStatus(`导入失败：${error.message}`, true);
    }
  }

  async function exportAnnotatedPdf() {
    if (!pdfDocument || !PDFLib) {
      setStatus("pdf-lib 未加载，无法导出 PDF。", true);
      return;
    }

    try {
      setStatus("正在生成带备注的新 PDF，页数多时请稍等...");
      const output = await PDFLib.PDFDocument.create();
      await preloadSignatureImages();

      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
        setStatus(`正在导出第 ${pageNumber} / ${pdfDocument.numPages} 页...`);
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 2 });
        const exportCanvas = document.createElement("canvas");
        const exportContext = exportCanvas.getContext("2d");
        exportCanvas.width = Math.floor(viewport.width);
        exportCanvas.height = Math.floor(viewport.height);

        await page.render({ canvasContext: exportContext, viewport }).promise;
        drawExportAnnotations(exportContext, pageNumber, exportCanvas.width, exportCanvas.height);

        const imageBytes = await canvasToPngBytes(exportCanvas);
        const image = await output.embedPng(imageBytes);
        const outputPage = output.addPage([viewport.width / 2, viewport.height / 2]);
        outputPage.drawImage(image, {
          x: 0,
          y: 0,
          width: viewport.width / 2,
          height: viewport.height / 2,
        });
      }

      addNativePdfOutlines(output, bookmarks);
      const bytes = await output.save();
      downloadBlob(bytes, buildFileName("annotated", "pdf"), "application/pdf");
      setStatus("带可见备注、高亮和原生书签的新 PDF 已导出。");
    } catch (error) {
      console.error(error);
      setStatus(`导出 PDF 失败：${error.message}`, true);
    }
  }

  function addNativePdfOutlines(pdfDoc, bookmarkItems) {
    const validBookmarks = bookmarkItems
      .filter((item) => item.page >= 1 && item.page <= pdfDoc.getPageCount())
      .map((item) => ({ ...item, title: String(item.title || `第 ${item.page} 页`) }));

    if (!validBookmarks.length || !PDFLib.PDFName || !PDFLib.PDFHexString || !PDFLib.PDFNumber) {
      return;
    }

    try {
      const { PDFName, PDFHexString, PDFNumber } = PDFLib;
      const context = pdfDoc.context;
      const pages = pdfDoc.getPages();
      const outlineRef = context.nextRef();
      const itemRefs = validBookmarks.map(() => context.nextRef());

      itemRefs.forEach((itemRef, index) => {
        const bookmark = validBookmarks[index];
        const destArray = context.obj([pages[bookmark.page - 1].ref, PDFName.of("Fit")]);
        const itemDict = context.obj({
          Title: PDFHexString.fromText(bookmark.title),
          Parent: outlineRef,
          Dest: destArray,
        });

        if (index > 0) itemDict.set(PDFName.of("Prev"), itemRefs[index - 1]);
        if (index < itemRefs.length - 1) itemDict.set(PDFName.of("Next"), itemRefs[index + 1]);

        context.assign(itemRef, itemDict);
      });

      const outlineDict = context.obj({
        Type: PDFName.of("Outlines"),
        First: itemRefs[0],
        Last: itemRefs[itemRefs.length - 1],
        Count: PDFNumber.of(itemRefs.length),
      });

      context.assign(outlineRef, outlineDict);
      pdfDoc.catalog.set(PDFName.of("Outlines"), outlineRef);
      pdfDoc.catalog.set(PDFName.of("PageMode"), PDFName.of("UseOutlines"));
    } catch (error) {
      console.warn("写入 PDF 原生书签失败，已继续导出普通 PDF。", error);
    }
  }

  function drawExportAnnotations(ctx, pageNumber, width, height) {
    for (const highlight of highlights.filter((item) => item.page === pageNumber)) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 230, 0, 0.35)";
      ctx.strokeStyle = "rgba(255, 170, 0, 0.95)";
      ctx.lineWidth = 3;
      ctx.fillRect(highlight.x * width, highlight.y * height, highlight.width * width, highlight.height * height);
      ctx.strokeRect(highlight.x * width, highlight.y * height, highlight.width * width, highlight.height * height);
      ctx.restore();
    }

    for (const note of notes.filter((item) => item.page === pageNumber)) {
      const x = note.x * width;
      const y = note.y * height;
      const textX = Math.min(width - 440, x + 26);
      const textY = Math.max(36, y - 14);

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fillStyle = "#ffd76a";
      ctx.strokeStyle = "#8a5a00";
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#4b3300";
      ctx.font = "bold 22px Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("!", x, y + 1);

      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = "20px Microsoft YaHei, sans-serif";
      const lines = wrapCanvasText(ctx, note.text, 400);
      const boxHeight = Math.max(36, lines.length * 26 + 16);
      ctx.fillStyle = "rgba(255, 250, 225, 0.96)";
      ctx.strokeStyle = "#d7a100";
      ctx.lineWidth = 2;
      ctx.fillRect(textX, textY, 420, boxHeight);
      ctx.strokeRect(textX, textY, 420, boxHeight);
      ctx.fillStyle = "#2a220f";
      lines.forEach((line, index) => ctx.fillText(line, textX + 10, textY + 10 + index * 26));
      ctx.restore();
    }

    for (const box of textBoxes.filter((item) => item.page === pageNumber)) {
      const x = box.x * width;
      const y = box.y * height;
      const boxWidth = box.width * width;
      ctx.save();
      ctx.font = "20px Microsoft YaHei, sans-serif";
      const lines = wrapCanvasText(ctx, box.text, boxWidth - 24);
      const boxHeight = Math.max(46, lines.length * 28 + 20);
      ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
      ctx.strokeStyle = "#2f6df6";
      ctx.lineWidth = 3;
      ctx.fillRect(x, y, boxWidth, boxHeight);
      ctx.strokeRect(x, y, boxWidth, boxHeight);
      ctx.fillStyle = "#14223a";
      lines.forEach((line, index) => ctx.fillText(line, x + 12, y + 12 + index * 28));
      ctx.restore();
    }

    for (const signature of signatures.filter((item) => item.page === pageNumber)) {
      const image = signatureImageCache.get(signature.id);
      if (image) {
        const sigWidth = signature.width * width;
        const ratio = image.naturalHeight && image.naturalWidth ? image.naturalHeight / image.naturalWidth : 0.35;
        ctx.drawImage(image, signature.x * width - sigWidth / 2, signature.y * height - (sigWidth * ratio) / 2, sigWidth, sigWidth * ratio);
      }
    }
  }

  function getRelativePoint(event) {
    const rect = annotationLayer.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    return { x, y };
  }

  function startAnnotationDrag(event, type, id, mode) {
    if (viewMode === "continuous") return;
    event.preventDefault();
    event.stopPropagation();
    const item = findAnnotation(type, id);
    if (!item) return;
    pushHistory();
    dragEdit = {
      type,
      id,
      mode,
      start: getRelativePoint(event),
      original: { ...item },
    };
  }

  function updateAnnotationDrag(event) {
    const item = findAnnotation(dragEdit.type, dragEdit.id);
    if (!item) return;
    const point = getRelativePoint(event);
    const dx = point.x - dragEdit.start.x;
    const dy = point.y - dragEdit.start.y;

    if (dragEdit.mode === "move") {
      item.x = clamp01(dragEdit.original.x + dx);
      item.y = clamp01(dragEdit.original.y + dy);
    } else {
      if (dragEdit.type === "highlight") {
        item.width = Math.max(0.02, Math.min(1 - item.x, dragEdit.original.width + dx));
        item.height = Math.max(0.02, Math.min(1 - item.y, dragEdit.original.height + dy));
      } else {
        item.width = Math.max(0.08, Math.min(0.8, dragEdit.original.width + dx));
      }
    }

    renderAnnotations();
  }

  function finishAnnotationDrag() {
    dragEdit = null;
    saveLocalState();
    updateToolbar();
  }

  function findAnnotation(type, id) {
    const source = {
      note: notes,
      highlight: highlights,
      textbox: textBoxes,
      signature: signatures,
    }[type];
    return source?.find((item) => item.id === id);
  }

  function normalizeRect(start, end) {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    return {
      x,
      y,
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  }

  function drawDraftHighlight(start, end) {
    const rect = normalizeRect(start, end);
    highlightDraft.style.left = `${rect.x * 100}%`;
    highlightDraft.style.top = `${rect.y * 100}%`;
    highlightDraft.style.width = `${rect.width * 100}%`;
    highlightDraft.style.height = `${rect.height * 100}%`;
  }

  function canvasToPngBytes(sourceCanvas) {
    return new Promise((resolve, reject) => {
      sourceCanvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error("Canvas 导出图片失败。"));
          return;
        }
        resolve(await blob.arrayBuffer());
      }, "image/png");
    });
  }

  function wrapCanvasText(ctx, text, maxWidth) {
    const chars = String(text || "备注").split("");
    const lines = [];
    let line = "";

    for (const char of chars) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = testLine;
      }

      if (lines.length >= 5) {
        break;
      }
    }

    if (line && lines.length < 5) {
      lines.push(line);
    }

    if (lines.length === 5 && chars.join("").length > lines.join("").length) {
      lines[4] = `${lines[4].slice(0, Math.max(0, lines[4].length - 1))}…`;
    }

    return lines;
  }

  async function getPageTextData(pageNumber, pageObject) {
    if (pageTextCache.has(pageNumber)) return pageTextCache.get(pageNumber);
    const page = pageObject || await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const items = [];
    const lines = [];
    let lastY = null;
    let line = "";

    for (const item of textContent.items) {
      const str = item.str || "";
      const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const fontHeight = Math.max(8, Math.abs(transform[3]) || item.height || 10);
      const x = transform[4];
      const y = transform[5] - fontHeight;
      const width = Math.max(item.width || str.length * 6, 8);
      const height = fontHeight * 1.25;

      items.push({
        str,
        lower: str.toLowerCase(),
        x: clamp01(x / viewport.width),
        y: clamp01(y / viewport.height),
        width: clamp01(width / viewport.width),
        height: clamp01(height / viewport.height),
      });

      const roundedY = Math.round(item.transform[5]);
      if (lastY !== null && Math.abs(roundedY - lastY) > 5) {
        if (line.trim()) lines.push(line.trim());
        line = "";
      }
      line += str;
      if (item.hasEOL) {
        lines.push(line.trim());
        line = "";
      } else {
        line += " ";
      }
      lastY = roundedY;
    }

    if (line.trim()) lines.push(line.trim());
    const data = { text: lines.join("\n").trim(), items };
    pageTextCache.set(pageNumber, data);
    return data;
  }

  async function generateThumbnails() {
    thumbnailList.innerHTML = "";
    if (!pdfDocument) return;
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "thumbnail-item";
      item.innerHTML = `<span>第 ${pageNumber} 页</span>`;
      item.addEventListener("click", () => {
        if (viewMode === "continuous") {
          scrollContinuousPageIntoView(pageNumber);
        } else {
          goToPage(pageNumber);
        }
      });
      thumbnailList.append(item);
      renderThumbnail(pageNumber, item);
    }
    updateThumbnailCurrent();
  }

  async function renderThumbnail(pageNumber, container) {
    try {
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 0.18 });
      const thumbCanvas = document.createElement("canvas");
      const thumbContext = thumbCanvas.getContext("2d");
      thumbCanvas.width = Math.floor(viewport.width);
      thumbCanvas.height = Math.floor(viewport.height);
      await page.render({ canvasContext: thumbContext, viewport }).promise;
      container.prepend(thumbCanvas);
    } catch {
      // 缩略图失败不影响主阅读。
    }
  }

  function updateThumbnailCurrent() {
    [...thumbnailList.querySelectorAll(".thumbnail-item")].forEach((item, index) => {
      item.classList.toggle("is-current", index + 1 === currentPage);
    });
  }

  function scrollContinuousPageIntoView(pageNumber) {
    const target = continuousPages.querySelector(`[data-page="${pageNumber}"]`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    currentPage = pageNumber;
    pageInput.value = currentPage;
    saveLocalState();
    updateThumbnailCurrent();
  }

  async function buildOutline() {
    outlineList.innerHTML = '<p class="empty-list">正在生成目录...</p>';
    outlineItems = [];
    if (!pdfDocument) return;

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const data = await getPageTextData(pageNumber);
      const candidate = data.text
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.length >= 4 && line.length <= 48);
      if (candidate) outlineItems.push({ page: pageNumber, title: candidate });
    }

    outlineList.innerHTML = "";
    if (!outlineItems.length) {
      outlineList.innerHTML = '<p class="empty-list">未识别到可用目录。</p>';
      return;
    }

    for (const item of outlineItems) {
      outlineList.append(createListItem(`第 ${item.page} 页`, item.title, [["跳转", () => goToPage(item.page)]]));
    }
  }

  async function runSearch() {
    if (!pdfDocument) return;
    searchTerm = searchInput.value.trim().toLowerCase();
    searchResults = [];
    if (!searchTerm) {
      clearSearch();
      return;
    }

    searchResultsEl.innerHTML = '<p class="empty-list">正在搜索...</p>';
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const data = await getPageTextData(pageNumber);
      const lower = data.text.toLowerCase();
      const index = lower.indexOf(searchTerm);
      if (index >= 0) {
        const preview = data.text.slice(Math.max(0, index - 24), index + searchTerm.length + 42).replace(/\s+/g, " ");
        searchResults.push({ page: pageNumber, preview });
      }
    }

    renderSearchResults();
    renderAnnotations();
    setStatus(`搜索完成：找到 ${searchResults.length} 个页面结果。`);
  }

  function renderSearchResults() {
    searchResultsEl.innerHTML = "";
    if (!searchResults.length) {
      searchResultsEl.innerHTML = '<p class="empty-list">没有搜索结果。</p>';
      return;
    }
    for (const result of searchResults) {
      searchResultsEl.append(createListItem(`第 ${result.page} 页`, result.preview, [["跳转", () => goToPage(result.page)]]));
    }
  }

  function clearSearch() {
    searchInput.value = "";
    searchTerm = "";
    searchResults = [];
    searchResultsEl.innerHTML = '<p class="empty-list">暂无搜索。</p>';
    renderAnnotations();
  }

  function getCurrentSearchBoxes() {
    if (!searchTerm || !pageTextCache.has(currentPage)) return [];
    return pageTextCache
      .get(currentPage)
      .items
      .filter((item) => item.lower.includes(searchTerm))
      .map((item) => ({ x: item.x, y: item.y, width: Math.max(item.width, 0.04), height: Math.max(item.height, 0.018) }));
  }

  function getStateSnapshot() {
    return cloneState({ notes, highlights, bookmarks, textBoxes, signatures });
  }

  function applyStateSnapshot(snapshot) {
    notes = snapshot.notes || [];
    highlights = snapshot.highlights || [];
    bookmarks = snapshot.bookmarks || [];
    textBoxes = snapshot.textBoxes || [];
    signatures = snapshot.signatures || [];
    renderAnnotations();
    renderSideLists();
    saveLocalState();
    updateToolbar();
  }

  function pushHistory() {
    undoStack.push(getStateSnapshot());
    if (undoStack.length > 60) undoStack.shift();
    redoStack = [];
    updateToolbar();
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(getStateSnapshot());
    applyStateSnapshot(undoStack.pop());
    setStatus("已撤销。");
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(getStateSnapshot());
    applyStateSnapshot(redoStack.pop());
    setStatus("已重做。");
  }

  function saveLocalState() {
    if (!currentFileKey) return;
    const data = { currentPage, viewMode, notes, highlights, bookmarks, textBoxes, signatures };
    localStorage.setItem(currentFileKey, JSON.stringify(data));
  }

  function loadLocalState() {
    if (!currentFileKey) return;
    try {
      const raw = localStorage.getItem(currentFileKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      currentPage = Number(data.currentPage) || 1;
      viewMode = data.viewMode || "single";
      viewModeSelect.value = viewMode;
      notes = Array.isArray(data.notes) ? data.notes : [];
      highlights = Array.isArray(data.highlights) ? data.highlights : [];
      bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];
      textBoxes = Array.isArray(data.textBoxes) ? data.textBoxes : [];
      signatures = Array.isArray(data.signatures) ? data.signatures : [];
      setStatus("已恢复上次阅读进度和本地批注。");
    } catch {
      // 本地缓存损坏时忽略。
    }
  }

  async function preloadSignatureImages() {
    signatureImageCache = new Map();
    await Promise.all(signatures.map(async (signature) => {
      signatureImageCache.set(signature.id, await loadImage(signature.dataUrl));
    }));
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function buildStorageKey(file) {
    return `simple-pdf-viewer:${file.name}:${file.size}:${file.lastModified}`;
  }

  function cloneState(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp01(value) {
    return Math.min(Math.max(value, 0), 1);
  }

  function updateToolbar() {
    const hasPdf = Boolean(pdfDocument);
    const total = pdfDocument ? pdfDocument.numPages : 0;
    prevPageBtn.disabled = !hasPdf || currentPage <= 1;
    nextPageBtn.disabled = !hasPdf || currentPage >= total;
    pageInput.disabled = !hasPdf;
    zoomOutBtn.disabled = !hasPdf || scale <= 0.4;
    zoomInBtn.disabled = !hasPdf || scale >= 3.5;
    fitWidthBtn.disabled = !hasPdf;
    readerFocusBtn.disabled = !hasPdf;
    undoBtn.disabled = !undoStack.length;
    redoBtn.disabled = !redoStack.length;
    addBookmarkBtn.disabled = !hasPdf;
    quickNoteBtn.disabled = !hasPdf;
    quickTextBoxBtn.disabled = !hasPdf;
    copyTextBtn.disabled = !hasPdf;
    exportPdfBtn.disabled = !hasPdf;
    toolSelect.disabled = !hasPdf;
    viewModeSelect.disabled = !hasPdf;
    searchBtn.disabled = !hasPdf;
    clearSearchBtn.disabled = !hasPdf;
    pageInput.value = hasPdf ? currentPage : 1;
    pageCount.textContent = total;
    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function setStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.classList.toggle("is-error", isError);
  }

  function setBootError(message) {
    const status = document.querySelector("#status");
    if (status) {
      status.textContent = message;
      status.classList.add("is-error");
    }
  }

  function createId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function waitForLayout() {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function buildFileName(suffix, ext) {
    const base = (currentFileName || "pdf")
      .replace(/\.pdf$/i, "")
      .replace(/[\\/:*?"<>|]/g, "_");
    return `${base}-${suffix}.${ext}`;
  }

  function downloadBlob(content, fileName, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function safePdfText(text) {
    return String(text).replace(/[^\x20-\x7E]/g, "?");
  }
})();
