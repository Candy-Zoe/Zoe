import { cleanWhitespace, matchAllGroups, readPdfString } from "./utils.js";

export function extractTextFromContentStreams(streams) {
  const textChunks = [];

  for (const stream of streams) {
    const blocks = matchAllGroups(/BT([\s\S]*?)ET/g, stream.decoded);

    for (const block of blocks) {
      const text = extractTextFromTextObject(block[1]);

      if (text) {
        textChunks.push(text);
      }
    }
  }

  return cleanWhitespace(textChunks.join("\n"));
}

export function extractTextFromTextObject(content) {
  const chunks = [];
  const tokenPattern = /(\((?:\\.|[^\\()])*\)|<[\da-fA-F\s]+>)\s*(Tj|'|")|\[((?:\s*(?:\((?:\\.|[^\\()])*\)|<[\da-fA-F\s]+>|-?\d+(?:\.\d+)?))*\s*)\]\s*TJ|(T\*|Td|TD)\b/g;
  let match;

  while ((match = tokenPattern.exec(content)) !== null) {
    if (match[1]) {
      chunks.push(readPdfString(match[1]));
    } else if (match[4]) {
      chunks.push("\n");
    } else if (match[3]) {
      const strings = [...match[3].matchAll(/\((?:\\.|[^\\()])*\)|<[\da-fA-F\s]+>/g)]
        .map((item) => readPdfString(item[0]))
        .filter(Boolean);
      chunks.push(strings.join(""));
    }
  }

  return cleanWhitespace(chunks.join(""));
}

