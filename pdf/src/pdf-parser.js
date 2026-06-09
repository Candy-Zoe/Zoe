import { decodeStream } from "./filters.js";
import {
  bytesToBinaryString,
  cleanWhitespace,
  matchAllGroups,
  readPdfString,
  unique,
} from "./utils.js";
import { extractTextFromContentStreams } from "./text-extractor.js";

export class SimplePDFParser {
  constructor(options = {}) {
    this.options = {
      parseStreams: true,
      extractText: true,
      ...options,
    };
  }

  async parse(input) {
    const buffer = await normalizeInput(input);
    const raw = bytesToBinaryString(buffer);
    const objects = this.parseObjects(raw);
    const streams = this.options.parseStreams ? await this.parseStreams(objects) : [];
    const metadata = this.extractMetadata(raw, objects);
    const pages = this.extractPages(raw, objects);
    const trailer = this.extractTrailer(raw);
    const xref = this.extractXref(raw);
    const catalog = this.extractCatalog(raw, objects);
    const resources = this.extractResourceSummary(objects);
    const outlines = this.extractOutlineReferences(raw, objects);
    const text = this.options.extractText ? extractTextFromContentStreams(streams) : "";

    return {
      header: this.extractHeader(raw),
      version: this.extractVersion(raw),
      fileSize: buffer.byteLength,
      isEncrypted: /\/Encrypt\b/.test(raw),
      startXref: this.extractStartXref(raw),
      objectCount: objects.length,
      pages,
      trailer,
      xref,
      catalog,
      resources,
      outlines,
      metadata,
      streams: streams.map((stream) => ({
        objectId: stream.objectId,
        filters: stream.filters,
        decodedLength: stream.decoded.length,
      })),
      text,
      objects,
      warnings: buildWarnings(raw, text),
    };
  }

  extractHeader(raw) {
    const match = raw.match(/%PDF-[0-9.]+/);
    return match?.[0] ?? "";
  }

  extractVersion(raw) {
    const match = raw.match(/%PDF-([0-9.]+)/);
    return match?.[1] ?? "";
  }

  extractStartXref(raw) {
    const match = raw.match(/startxref\s+(\d+)/);
    return match ? Number(match[1]) : null;
  }

  parseObjects(raw) {
    const matches = matchAllGroups(/(\d+)\s+(\d+)\s+obj([\s\S]*?)endobj/g, raw);

    return matches.map((match) => {
      const body = match[3].trim();
      const streamMatch = body.match(/([\s\S]*?)stream([\s\S]*?)endstream/);

      return {
        id: Number(match[1]),
        generation: Number(match[2]),
        body,
        dictionary: streamMatch ? streamMatch[1].trim() : extractDictionary(body),
        hasStream: Boolean(streamMatch),
        streamBody: streamMatch?.[2] ?? "",
      };
    });
  }

  async parseStreams(objects) {
    const streams = [];

    for (const object of objects.filter((item) => item.hasStream)) {
      try {
        const decoded = await decodeStream(object.streamBody, object.dictionary);
        const filters = [...object.dictionary.matchAll(/\/Filter\s*(?:\[([^\]]+)\]|\/([A-Za-z0-9]+))/g)]
          .flatMap((match) => match[1]?.match(/\/[A-Za-z0-9]+/g) ?? [`/${match[2]}`])
          .filter(Boolean)
          .map((filter) => filter.replace("/", ""));

        streams.push({
          objectId: object.id,
          dictionary: object.dictionary,
          filters,
          decoded,
        });
      } catch (error) {
        streams.push({
          objectId: object.id,
          dictionary: object.dictionary,
          filters: ["解码失败"],
          decoded: "",
          error: error.message,
        });
      }
    }

    return streams;
  }

  extractMetadata(raw, objects) {
    const infoRef = raw.match(/\/Info\s+(\d+)\s+(\d+)\s+R/);
    const infoObject = infoRef
      ? objects.find((object) => object.id === Number(infoRef[1]) && object.generation === Number(infoRef[2]))
      : null;
    const source = infoObject?.body ?? raw;

    return {
      title: readDictionaryString(source, "Title"),
      author: readDictionaryString(source, "Author"),
      subject: readDictionaryString(source, "Subject"),
      keywords: readDictionaryString(source, "Keywords"),
      creator: readDictionaryString(source, "Creator"),
      producer: readDictionaryString(source, "Producer"),
      creationDate: normalizePdfDate(readDictionaryString(source, "CreationDate")),
      modificationDate: normalizePdfDate(readDictionaryString(source, "ModDate")),
    };
  }

  extractPages(raw, objects) {
    const pageObjects = objects
      .filter((object) => /\/Type\s*\/Page(?!s)\b/.test(object.body))
    const pageObjectIds = pageObjects.map((object) => object.id);
    const countMatches = [...raw.matchAll(/\/Type\s*\/Pages\b[\s\S]{0,300}?\/Count\s+(\d+)/g)]
      .map((match) => Number(match[1]))
      .filter(Number.isFinite);
    const count = pageObjectIds.length || Math.max(0, ...countMatches);

    return {
      count,
      objectIds: unique(pageObjectIds),
      details: pageObjects.map((object) => ({
        objectId: object.id,
        mediaBox: readNumberArray(object.body, "MediaBox"),
        cropBox: readNumberArray(object.body, "CropBox"),
        rotate: readDictionaryNumber(object.body, "Rotate"),
        resourcesRef: readReference(object.body, "Resources"),
        contentsRef: readReference(object.body, "Contents"),
      })),
    };
  }

  extractTrailer(raw) {
    const matches = [...raw.matchAll(/trailer\s*<<(.*?)>>/gs)];
    const dictionary = matches.at(-1)?.[1] ?? "";

    return {
      size: readDictionaryNumber(dictionary, "Size"),
      root: readReference(dictionary, "Root"),
      info: readReference(dictionary, "Info"),
      encrypt: readReference(dictionary, "Encrypt"),
      id: readTrailerId(dictionary),
      raw: dictionary ? `<<${dictionary}>>` : "",
    };
  }

  extractXref(raw) {
    const sectionMatch = raw.match(/xref\s+([\s\S]*?)trailer/);

    if (!sectionMatch) {
      return {
        type: /\/Type\s*\/XRef\b/.test(raw) ? "stream" : "unknown",
        entries: [],
        count: 0,
      };
    }

    const entries = [];
    const lines = sectionMatch[1].trim().split(/\r?\n/);
    let start = 0;
    let remaining = 0;

    for (const line of lines) {
      const header = line.match(/^(\d+)\s+(\d+)$/);
      if (header) {
        start = Number(header[1]);
        remaining = Number(header[2]);
        continue;
      }

      const entry = line.match(/^(\d{10})\s+(\d{5})\s+([nf])\s*$/);
      if (entry && remaining > 0) {
        entries.push({
          objectId: start,
          offset: Number(entry[1]),
          generation: Number(entry[2]),
          inUse: entry[3] === "n",
        });
        start += 1;
        remaining -= 1;
      }
    }

    return {
      type: "table",
      entries,
      count: entries.length,
      inUseCount: entries.filter((entry) => entry.inUse).length,
    };
  }

  extractCatalog(raw, objects) {
    const rootRef = this.extractTrailer(raw).root;
    const catalogObject = rootRef
      ? objects.find((object) => object.id === rootRef.objectId && object.generation === rootRef.generation)
      : objects.find((object) => /\/Type\s*\/Catalog\b/.test(object.body));
    const source = catalogObject?.body ?? "";

    return {
      objectId: catalogObject?.id ?? null,
      pagesRef: readReference(source, "Pages"),
      outlinesRef: readReference(source, "Outlines"),
      pageMode: readName(source, "PageMode"),
      openAction: readReference(source, "OpenAction"),
      raw: catalogObject?.dictionary ?? "",
    };
  }

  extractResourceSummary(objects) {
    const fontNames = [];
    const imageObjects = [];
    const formObjects = [];

    for (const object of objects) {
      const body = object.body;
      for (const match of body.matchAll(/\/Font\s*<<([\s\S]*?)>>/g)) {
        fontNames.push(...[...match[1].matchAll(/\/([A-Za-z0-9_.-]+)\s+\d+\s+\d+\s+R/g)].map((item) => item[1]));
      }

      if (/\/Subtype\s*\/Image\b/.test(body)) {
        imageObjects.push(object.id);
      }

      if (/\/AcroForm\b|\/Annots\b/.test(body)) {
        formObjects.push(object.id);
      }
    }

    return {
      fonts: unique(fontNames),
      fontCount: unique(fontNames).length,
      imageObjectIds: unique(imageObjects),
      imageCount: unique(imageObjects).length,
      annotationOrFormObjectIds: unique(formObjects),
    };
  }

  extractOutlineReferences(raw, objects) {
    const catalog = this.extractCatalog(raw, objects);
    const outlineRoot = catalog.outlinesRef
      ? objects.find((object) => object.id === catalog.outlinesRef.objectId && object.generation === catalog.outlinesRef.generation)
      : null;
    const outlineObjects = objects.filter((object) => /\/Title\s*(\(|<)|\/Dest\b|\/A\s*<</.test(object.body));

    return {
      rootRef: catalog.outlinesRef,
      rootObjectId: outlineRoot?.id ?? null,
      count: readDictionaryNumber(outlineRoot?.body ?? "", "Count") ?? outlineObjects.length,
      items: outlineObjects.map((object) => ({
        objectId: object.id,
        title: readDictionaryString(object.body, "Title"),
        destRef: readReference(object.body, "Dest"),
        firstRef: readReference(object.body, "First"),
        nextRef: readReference(object.body, "Next"),
        prevRef: readReference(object.body, "Prev"),
      })),
    };
  }
}

function extractDictionary(body) {
  const match = body.match(/<<([\s\S]*?)>>/);
  return match ? `<<${match[1]}>>` : "";
}

function readDictionaryString(source, key) {
  const pattern = new RegExp(`/${key}\\s*(\\((?:\\\\.|[^\\\\()])*\\)|<[\\da-fA-F\\s]+>)`);
  const match = source.match(pattern);
  return match ? cleanWhitespace(readPdfString(match[1])) : "";
}

function readDictionaryNumber(source, key) {
  const pattern = new RegExp(`/${key}\\s+(-?\\d+(?:\\.\\d+)?)`);
  const match = source.match(pattern);
  return match ? Number(match[1]) : null;
}

function readReference(source, key) {
  const pattern = new RegExp(`/${key}\\s+(\\d+)\\s+(\\d+)\\s+R`);
  const match = source.match(pattern);

  if (!match) {
    return null;
  }

  return {
    objectId: Number(match[1]),
    generation: Number(match[2]),
  };
}

function readName(source, key) {
  const pattern = new RegExp(`/${key}\\s+/([A-Za-z0-9_.-]+)`);
  const match = source.match(pattern);
  return match?.[1] ?? "";
}

function readNumberArray(source, key) {
  const pattern = new RegExp(`/${key}\\s*\\[([^\\]]+)\\]`);
  const match = source.match(pattern);

  if (!match) {
    return [];
  }

  return match[1]
    .trim()
    .split(/\s+/)
    .map(Number)
    .filter(Number.isFinite);
}

function readTrailerId(source) {
  const match = source.match(/\/ID\s*\[\s*(<[\da-fA-F\s]+>|\((?:\\.|[^\\()])*\))\s*(<[\da-fA-F\s]+>|\((?:\\.|[^\\()])*\))/);

  if (!match) {
    return [];
  }

  return [readPdfString(match[1]), readPdfString(match[2])];
}

function normalizePdfDate(value) {
  if (!value) {
    return "";
  }

  const match = value.match(/^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/);

  if (!match) {
    return value;
  }

  const [, year, month = "01", day = "01", hour = "00", minute = "00", second = "00"] = match;
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function buildWarnings(raw, text) {
  const warnings = [];

  if (/\/Encrypt\b/.test(raw)) {
    warnings.push("检测到加密标记，当前轻量解析器无法解析加密 PDF 的正文。");
  }

  if (/\/ObjStm\b/.test(raw)) {
    warnings.push("检测到对象流，部分对象可能被压缩在 ObjStm 中，轻量解析结果可能不完整。");
  }

  if (!text) {
    warnings.push("未提取到正文文本。可能是扫描件、复杂字体编码、图片型 PDF 或浏览器不支持流解码。");
  }

  return warnings;
}

async function normalizeInput(input) {
  if (input instanceof ArrayBuffer) {
    return input;
  }

  if (input instanceof Uint8Array) {
    return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
  }

  if (input instanceof Blob) {
    return input.arrayBuffer();
  }

  throw new TypeError("parse(input) 需要 File、Blob、ArrayBuffer 或 Uint8Array。");
}
