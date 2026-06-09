import { binaryStringToBytes, bytesToBinaryString } from "./utils.js";

export async function decodeStream(streamBody, dictionary = "") {
  const filters = getFilters(dictionary);
  let bytes = binaryStringToBytes(trimStreamLineBreaks(streamBody));

  for (const filter of filters) {
    if (filter === "FlateDecode" || filter === "Fl") {
      bytes = await inflate(bytes);
    }
  }

  return bytesToBinaryString(bytes);
}

export function getFilters(dictionary) {
  const filterMatch = dictionary.match(/\/Filter\s*(\[[^\]]+\]|\/[A-Za-z0-9]+)/);

  if (!filterMatch) {
    return [];
  }

  return [...filterMatch[1].matchAll(/\/([A-Za-z0-9]+)/g)].map((item) => item[1]);
}

function trimStreamLineBreaks(streamBody) {
  let body = streamBody;

  if (body.startsWith("\r\n")) {
    body = body.slice(2);
  } else if (body.startsWith("\n") || body.startsWith("\r")) {
    body = body.slice(1);
  }

  if (body.endsWith("\r\n")) {
    body = body.slice(0, -2);
  } else if (body.endsWith("\n") || body.endsWith("\r")) {
    body = body.slice(0, -1);
  }

  return body;
}

async function inflate(bytes) {
  if (typeof DecompressionStream !== "undefined") {
    const stream = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream("deflate"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  console.warn("当前浏览器不支持 DecompressionStream，FlateDecode 流将按原文返回。");
  return bytes;
}

