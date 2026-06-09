import { SimplePDFParser } from "../src/index.js";

const parser = new SimplePDFParser();

const dropZone = document.querySelector("#dropZone");
const fileInput = document.querySelector("#fileInput");
const pickButton = document.querySelector("#pickButton");
const statusEl = document.querySelector("#status");
const summaryEl = document.querySelector("#summary");
const metadataEl = document.querySelector("#metadata");
const warningsEl = document.querySelector("#warnings");
const textOutput = document.querySelector("#textOutput");
const jsonOutput = document.querySelector("#jsonOutput");
const streamsEl = document.querySelector("#streams");

pickButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => handleFile(fileInput.files?.[0]));

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
  handleFile(event.dataTransfer.files?.[0]);
});

async function handleFile(file) {
  if (!file) {
    return;
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    setStatus("请选择 PDF 文件。", true);
    return;
  }

  try {
    setStatus(`正在解析：${file.name}`);
    clearResult();

    const result = await parser.parse(file);

    renderSummary(file, result);
    renderMetadata(result.metadata);
    renderWarnings(result.warnings);
    renderStreams(result.streams);
    textOutput.value = result.text || "未提取到文本。";
    jsonOutput.textContent = JSON.stringify(toSerializableResult(result), null, 2);
    setStatus(`解析完成：${file.name}`);
  } catch (error) {
    console.error(error);
    setStatus(`解析失败：${error.message}`, true);
  }
}

function renderSummary(file, result) {
  renderDefinitionList(summaryEl, {
    文件名: file.name,
    文件大小: formatBytes(result.fileSize),
    PDF版本: result.version || "未知",
    Header: result.header || "未知",
    页数: result.pages.count,
    对象数量: result.objectCount,
    流数量: result.streams.length,
    加密: result.isEncrypted ? "是" : "否",
    startxref: result.startXref ?? "未知",
  });
}

function renderMetadata(metadata) {
  renderDefinitionList(metadataEl, {
    标题: metadata.title || "无",
    作者: metadata.author || "无",
    主题: metadata.subject || "无",
    关键词: metadata.keywords || "无",
    创建工具: metadata.creator || "无",
    生成器: metadata.producer || "无",
    创建时间: metadata.creationDate || "无",
    修改时间: metadata.modificationDate || "无",
  });
}

function renderDefinitionList(element, data) {
  element.innerHTML = "";

  for (const [key, value] of Object.entries(data)) {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = key;
    dd.textContent = value;
    element.append(dt, dd);
  }
}

function renderWarnings(warnings) {
  warningsEl.innerHTML = "";

  if (!warnings.length) {
    const item = document.createElement("li");
    item.textContent = "没有检测到明显问题。";
    warningsEl.append(item);
    return;
  }

  for (const warning of warnings) {
    const item = document.createElement("li");
    item.textContent = warning;
    warningsEl.append(item);
  }
}

function renderStreams(streams) {
  streamsEl.innerHTML = "";

  if (!streams.length) {
    streamsEl.innerHTML = `<tr><td colspan="3">没有发现流对象。</td></tr>`;
    return;
  }

  for (const stream of streams) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(stream.objectId)}</td>
      <td>${escapeHtml(stream.filters.join(", ") || "无")}</td>
      <td>${escapeHtml(stream.decodedLength)}</td>
    `;
    streamsEl.append(row);
  }
}

function clearResult() {
  summaryEl.innerHTML = "";
  metadataEl.innerHTML = "";
  warningsEl.innerHTML = "";
  streamsEl.innerHTML = "";
  textOutput.value = "";
  jsonOutput.textContent = "{}";
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("is-error", isError);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) {
    return "未知";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toSerializableResult(result) {
  return {
    ...result,
    objects: result.objects.map((object) => ({
      id: object.id,
      generation: object.generation,
      hasStream: object.hasStream,
      dictionary: object.dictionary,
      bodyPreview: object.body.slice(0, 600),
    })),
  };
}

