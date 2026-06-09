export function bytesToBinaryString(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let result = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    result += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return result;
}

export function binaryStringToBytes(binary) {
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i) & 0xff;
  }

  return bytes;
}

export function decodeLatin1(binary) {
  try {
    return new TextDecoder("latin1").decode(binaryStringToBytes(binary));
  } catch {
    return binary;
  }
}

export function decodeUtf8(bytes) {
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return bytesToBinaryString(bytes);
  }
}

export function unique(values) {
  return [...new Set(values)];
}

export function cleanWhitespace(value) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function decodePdfLiteralString(value) {
  let output = "";

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];

    if (char !== "\\") {
      output += char;
      continue;
    }

    const next = value[++i];

    if (next === "n") output += "\n";
    else if (next === "r") output += "\r";
    else if (next === "t") output += "\t";
    else if (next === "b") output += "\b";
    else if (next === "f") output += "\f";
    else if (next === "(" || next === ")" || next === "\\") output += next;
    else if (/\d/.test(next)) {
      let octal = next;

      for (let j = 0; j < 2 && /\d/.test(value[i + 1]); j += 1) {
        octal += value[++i];
      }

      output += String.fromCharCode(parseInt(octal, 8));
    } else if (next === "\r" && value[i + 1] === "\n") {
      i += 1;
    } else if (next === "\n" || next === "\r") {
      // PDF 中反斜杠后的换行表示续行，忽略即可。
    } else {
      output += next ?? "";
    }
  }

  if (output.charCodeAt(0) === 0xfe && output.charCodeAt(1) === 0xff) {
    const bytes = binaryStringToBytes(output.slice(2));
    try {
      return new TextDecoder("utf-16be").decode(bytes);
    } catch {
      return output.slice(2);
    }
  }

  return decodeLatin1(output);
}

export function decodePdfHexString(hex) {
  const normalized = hex.replace(/\s+/g, "");
  const padded = normalized.length % 2 === 0 ? normalized : `${normalized}0`;
  const bytes = new Uint8Array(padded.length / 2);

  for (let i = 0; i < padded.length; i += 2) {
    bytes[i / 2] = parseInt(padded.slice(i, i + 2), 16);
  }

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    try {
      return new TextDecoder("utf-16be").decode(bytes.slice(2));
    } catch {
      return decodeUtf8(bytes.slice(2));
    }
  }

  return decodeUtf8(bytes);
}

export function readPdfString(token) {
  const trimmed = token.trim();

  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    return decodePdfLiteralString(trimmed.slice(1, -1));
  }

  if (trimmed.startsWith("<") && trimmed.endsWith(">") && !trimmed.startsWith("<<")) {
    return decodePdfHexString(trimmed.slice(1, -1));
  }

  return trimmed;
}

export function matchAllGroups(pattern, text) {
  const matches = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    matches.push(match);
  }

  return matches;
}

