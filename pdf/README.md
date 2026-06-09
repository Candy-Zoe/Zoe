# SimplePDFParser

一个用原生 JavaScript 实现的轻量级 PDF 解析库示例，包含可直接打开的 HTML/CSS 测试页面。

## 文件结构

```text
.
├── src
│   ├── index.js           # 库导出入口
│   ├── pdf-parser.js      # PDF 解析主类
│   ├── filters.js         # Stream 过滤器解码
│   ├── text-extractor.js  # 文本内容提取
│   └── utils.js           # 字节、字符串和 PDF 字符串工具
└── demo
    ├── index.html         # 浏览器测试页
    ├── standalone.html    # 可直接双击打开的独立测试页
    ├── viewer.html        # PDF 内容查看器，支持翻页、缩放、备注、书签和导出
    ├── viewer.js          # PDF.js 查看器与批注交互逻辑
    ├── viewer.css         # PDF.js 查看器与批注样式
    ├── app.js             # 测试页交互逻辑
    └── styles.css         # 测试页样式
```

## 使用方式

### 推荐：查看内容和翻页

如果你需要像阅读器一样看 PDF 内容、翻页、跳页、缩放、加备注、加书签和做高亮，请打开 `demo/viewer.html`。

这个页面使用 PDF.js 渲染 PDF，可以正确显示大多数中文 PDF、复杂字体 PDF 和图片型扫描 PDF。它也支持提取当前页可复制文本；如果 PDF 本身是扫描图片，页面能显示，但文本区域可能没有可复制文字。

查看器新增功能：

- 翻页、跳页、缩放、适合宽度
- 阅读模式切换：单页、双页、连续滚动
- 当前页文本提取与复制
- 缩略图侧边栏，点击缩略图快速跳页
- 搜索 PDF 文本，并在当前页高亮匹配文本块
- 自动提取全文目录，生成可跳转目录列表
- 点击页面添加备注
- 框选页面区域添加高亮
- 添加文本框
- 选择签名图片并放置到页面
- 批注拖拽移动：备注、高亮、文本框、签名都可拖动
- 批注缩放：高亮、文本框和签名右下角可拖拽缩放
- 添加书签并从右侧列表跳转
- 撤销和重做，支持 `Ctrl+Z` / `Ctrl+Y`
- 本地自动保存批注和阅读进度，下次打开同一个 PDF 自动恢复
- 导出和导入批注 JSON
- 导出带可见备注、高亮、文本框、签名和 PDF 原生书签的新 PDF
- 手机和平板自适应布局，工具栏支持横向滑动
- 电脑端默认扩大阅读区域，并提供“大屏阅读”模式隐藏右侧编辑栏

说明：右侧书签会随批注 JSON 保存；导出 PDF 时会尝试写入 PDF 原生书签目录，同时把页面、中文备注、高亮、文本框和签名一起“扁平化”为可见内容。部分 PDF 阅读器可能不自动展开书签栏，但书签目录会保存在导出的 PDF 结构中。

移动端提示：手机或平板上建议横屏阅读；工具栏可以左右滑动，PDF 打开后会自动按阅读区域宽度适配。

阅读模式说明：连续滚动模式用于快速阅读全文，批注编辑建议在单页或双页模式下完成。

### 方式一：直接双击打开

如果只是想快速测试，请直接打开 `demo/standalone.html`。这个文件把测试脚本内联在 HTML 中，不会触发 `file://` 下的 ES Modules CORS 限制。

### 方式二：本地服务打开模块化版本

`demo/index.html` 使用了 ES Modules，不能直接用 `file://` 双击打开，否则浏览器会报 CORS 错误。请用本地 HTTP 服务打开：

```bash
npx serve .
```

然后在浏览器中打开服务地址，进入 `demo/index.html`，选择或拖拽 PDF 文件进行解析。

如果你使用 VS Code，也可以用 Live Server 插件打开 `demo/index.html`。

## 在代码中使用

```js
import { SimplePDFParser } from "./src/index.js";

const parser = new SimplePDFParser();
const result = await parser.parse(file);

console.log(result.metadata);
console.log(result.pages.count);
console.log(result.text);
```

`parse(input)` 支持以下输入：

- `File`
- `Blob`
- `ArrayBuffer`
- `Uint8Array`

解析结果现在还包含以下增强结构：

- `trailer`：读取 `Root`、`Info`、`Encrypt`、`ID` 等 trailer 信息
- `xref`：解析传统交叉引用表，返回对象偏移和占用状态
- `catalog`：读取目录对象、页面树引用、原生书签引用和打开模式
- `pages.details`：返回页面对象、MediaBox、CropBox、旋转角度、资源引用和内容引用
- `resources`：统计字体名、图片对象和表单/批注相关对象
- `outlines`：识别 PDF 原生书签根对象和书签条目引用

## 当前支持能力

- 读取 PDF Header 和版本号
- 解析普通间接对象
- 识别页面对象并统计页数
- 读取 Info 元数据，例如标题、作者、主题、创建工具、生成器
- 识别 Stream 对象
- 支持现代浏览器中的 `FlateDecode` 解码
- 从基础文本操作符中提取文本，例如 `Tj`、`TJ`、`'`、`"`、`T*`
- 检测加密 PDF、对象流和文本提取失败等情况，并在测试页显示提示

## 限制说明

这是一个轻量级学习和测试用 PDF 解析库，不是完整 PDF 引擎。以下场景可能无法完整解析：

- 加密 PDF
- 扫描件或图片型 PDF
- 使用复杂字体编码、ToUnicode CMap 或自定义字形映射的 PDF
- 大量使用对象流、交叉引用流的现代 PDF
- `LZWDecode`、`ASCII85Decode`、`RunLengthDecode` 等尚未实现的过滤器

如果要做生产级 PDF 渲染或高准确率文本提取，建议基于 PDF.js、pdf-lib、MuPDF 或服务端解析工具扩展。

本项目已经额外提供了 `demo/viewer.html` 作为 PDF.js 查看器。如果你的目标是“看内容、翻页、缩放、备注、书签”，优先使用这个页面，而不是轻量解析器页面。
