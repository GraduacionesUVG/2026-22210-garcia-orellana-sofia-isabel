import JSZip from "jszip";
import {
  decodePDFRawStream,
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
} from "pdf-lib";

export interface BinaryResponse {
  status(): number;
  headers(): Record<string, string>;
  body(): Promise<Buffer>;
}

export interface DownloadExpectation {
  filename: string;
  contentType: string;
  signature?: string | Buffer;
}

export interface InspectedZipArchive {
  members: string[];
  markdown: Map<string, string>;
  docxText: Map<string, string>;
  pdfText: Map<string, string>;
  pdfPages: Map<string, number>;
}

const DOCX_REQUIRED_MEMBERS = [
  "[Content_Types].xml",
  "_rels/.rels",
  "word/document.xml",
] as const;
const CENTRAL_FILE_HEADER = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const MAX_EOCD_SEARCH = 65_557;

function header(response: BinaryResponse, name: string): string {
  const entry = Object.entries(response.headers()).find(
    ([key]) => key.toLowerCase() === name.toLowerCase()
  );
  return entry?.[1] ?? "";
}

export async function assertDownload(
  response: BinaryResponse,
  expected: DownloadExpectation
): Promise<Buffer> {
  if (response.status() !== 200) {
    throw new Error(`Expected download status 200, received ${response.status()}`);
  }

  const contentType = header(response, "content-type").toLowerCase();
  if (contentType !== expected.contentType.toLowerCase()) {
    throw new Error(
      `Expected Content-Type ${expected.contentType}, received ${contentType || "none"}`
    );
  }

  const disposition = header(response, "content-disposition");
  const expectedDisposition = `attachment; filename="${expected.filename}"`;
  if (disposition !== expectedDisposition) {
    throw new Error(
      `Expected Content-Disposition ${expectedDisposition}, received ${disposition || "none"}`
    );
  }

  const cacheControl = header(response, "cache-control").toLowerCase();
  if (cacheControl !== "no-store") {
    throw new Error(
      `Expected Cache-Control no-store, received ${cacheControl || "none"}`
    );
  }

  const body = await response.body();
  if (body.length === 0) throw new Error("Expected a non-empty download body");

  if (expected.signature !== undefined) {
    const signature = Buffer.isBuffer(expected.signature)
      ? expected.signature
      : Buffer.from(expected.signature, "ascii");
    if (!body.subarray(0, signature.length).equals(signature)) {
      throw new Error(`Expected download signature ${signature.toString("ascii")}`);
    }
  }

  return body;
}

export async function assertDocxArchive(bytes: Buffer): Promise<string[]> {
  if (bytes.length < 2 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error("Expected DOCX PK signature");
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch (error) {
    throw new Error("Expected a readable DOCX ZIP package", { cause: error });
  }

  const members = Object.values(zip.files)
    .filter((entry) => !entry.dir)
    .map((entry) => entry.name)
    .sort();

  for (const required of DOCX_REQUIRED_MEMBERS) {
    const entry = zip.file(required);
    if (!entry) throw new Error(`Missing DOCX member: ${required}`);
    const content = await entry.async("nodebuffer");
    if (content.length === 0) throw new Error(`Empty DOCX member: ${required}`);
  }

  return members;
}

function decodeXmlEntities(value: string): string {
  return value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|amp|lt|gt|quot|apos);/giu,
    (entity, decimal: string | undefined, hex: string | undefined) => {
      if (decimal) return String.fromCodePoint(Number(decimal));
      if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
      const named: Record<string, string> = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&apos;": "'",
      };
      return named[entity.toLowerCase()] ?? entity;
    }
  );
}

export async function extractDocxText(bytes: Buffer): Promise<string> {
  await assertDocxArchive(bytes);
  const zip = await JSZip.loadAsync(bytes);
  const xml = await zip.file("word/document.xml")!.async("string");
  const tokens = xml.match(
    /<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>|<w:(?:tab|br|cr)(?:\s[^>]*)?\s*\/?>|<\/w:p>/giu
  ) ?? [];

  const text = tokens
    .map((token) => {
      if (/^<w:tab\b/iu.test(token)) return "\t";
      if (/^<w:(?:br|cr)\b/iu.test(token) || /^<\/w:p/iu.test(token)) {
        return "\n";
      }
      return decodeXmlEntities(token.replace(/^<w:t(?:\s[^>]*)?>|<\/w:t>$/giu, ""));
    })
    .join("")
    .replace(/[\t ]+\n/gu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();

  if (!text) throw new Error("Expected DOCX document XML to contain text");
  return text;
}

// WHATWG Windows-1252 index 0x80..0x9f. Older Node/ICU releases can
// decode this range as C1 controls; PDF assertions must be runtime-independent.
// https://encoding.spec.whatwg.org/index-windows-1252.txt
const WINDOWS_1252_C1 = [
  0x20ac, 0x0081, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021,
  0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x008d, 0x017d, 0x008f,
  0x0090, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
  0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x009d, 0x017e, 0x0178,
];

function decodePdfBytes(bytes: number[]): string {
  return bytes.map(value => {
    // PDF octal escapes retain only the low eight bits (e.g. \777 -> 0xff).
    const byte = value & 0xff;
    return String.fromCodePoint(
      byte >= 0x80 && byte <= 0x9f ? WINDOWS_1252_C1[byte - 0x80] : byte
    );
  }).join("");
}

function readPdfLiteral(source: string, start: number): [string, number] {
  const bytes: number[] = [];
  let depth = 1;
  let index = start + 1;

  while (index < source.length && depth > 0) {
    const char = source[index];
    if (char === "\\") {
      index += 1;
      const escaped = source[index];
      if (escaped === "\r" && source[index + 1] === "\n") index += 2;
      else if (escaped === "\r" || escaped === "\n") index += 1;
      else if (/[0-7]/u.test(escaped ?? "")) {
        const octal = source.slice(index).match(/^[0-7]{1,3}/u)![0];
        bytes.push(Number.parseInt(octal, 8));
        index += octal.length;
      } else {
        const escapes: Record<string, number> = {
          n: 0x0a,
          r: 0x0d,
          t: 0x09,
          b: 0x08,
          f: 0x0c,
        };
        bytes.push(escapes[escaped] ?? (escaped?.charCodeAt(0) || 0));
        index += 1;
      }
      continue;
    }
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (depth > 0) bytes.push(char.charCodeAt(0));
    index += 1;
  }

  if (depth !== 0) throw new Error("Unterminated PDF literal string");
  return [decodePdfBytes(bytes), index];
}

function readPdfHex(source: string, start: number, unicodeMap?: Map<string, string>): [string, number] {
  const end = source.indexOf(">", start + 1);
  if (end === -1) throw new Error("Unterminated PDF hex string");
  let hex = source.slice(start + 1, end).replace(/\s/gu, "");
  if (!/^[\da-f]*$/iu.test(hex)) throw new Error("Invalid PDF hex string");
  if (hex.length % 2 === 1) hex += "0";
  if (unicodeMap) {
    if (hex.length % 4 !== 0) throw new Error("Invalid two-byte PDF glyph sequence");
    let text = "";
    for (let index = 0; index < hex.length; index += 4) {
      const key = hex.slice(index, index + 4).toUpperCase();
      const value = unicodeMap.get(key);
      if (value === undefined) throw new Error(`Unmapped PDF glyph ${key}`);
      text += value;
    }
    return [text, end + 1];
  }
  return [decodePdfBytes([...Buffer.from(hex, "hex")]), end + 1];
}

function extractTextOperands(source: string, unicodeFonts: Map<string, Map<string, string>>): string[] {
  const output: string[] = [];
  let operand: string[] = [];
  let arrayDepth = 0;
  let index = 0;
  let lastName = "";
  let unicodeMap: Map<string, string> | undefined;
  let textLine = "";

  while (index < source.length) {
    const char = source[index];
    if (/\s/u.test(char)) {
      index += 1;
      continue;
    }
    if (char === "%") {
      const end = source.indexOf("\n", index);
      index = end === -1 ? source.length : end + 1;
      continue;
    }
    if (char === "[") {
      arrayDepth += 1;
      operand = [];
      index += 1;
      continue;
    }
    if (char === "]") {
      arrayDepth = Math.max(0, arrayDepth - 1);
      index += 1;
      continue;
    }
    if (char === "(") {
      const [value, next] = readPdfLiteral(source, index);
      operand = arrayDepth > 0 ? [...operand, value] : [value];
      index = next;
      continue;
    }
    if (char === "<" && source[index + 1] !== "<") {
      const [value, next] = readPdfHex(source, index, unicodeMap);
      operand = arrayDepth > 0 ? [...operand, value] : [value];
      index = next;
      continue;
    }

    const match = source.slice(index).match(/^[^\s<>()\[\]]+/u);
    const token = match?.[0] ?? char;
    if (token.startsWith("/")) lastName = token;
    if (token === "Tf") unicodeMap = unicodeFonts.get(lastName);
    if (token === "Tj" || token === "TJ" || token === "'" || token === '"') {
      if (operand.length > 0) textLine += operand.join("");
      operand = [];
    }
    if (token === "ET" && textLine) {
      output.push(textLine);
      textLine = "";
    }
    index += token.length;
  }

  if (textLine) output.push(textLine);
  return output;
}

export async function extractPdfText(bytes: Buffer): Promise<string> {
  const pdf = await PDFDocument.load(bytes);
  const text: string[] = [];

  for (const page of pdf.getPages()) {
    const unicodeFonts = new Map<string, Map<string, string>>();
    const fonts = page.node.Resources()?.lookupMaybe(PDFName.of("Font"), PDFDict);
    for (const [name, ref] of fonts?.entries() ?? []) {
      const font = pdf.context.lookup(ref, PDFDict);
      const cmapReference = font.get(PDFName.of("ToUnicode"));
      const cmap = cmapReference ? pdf.context.lookup(cmapReference) : undefined;
      if (!cmap) continue;
      if (!(cmap instanceof PDFRawStream)) throw new Error("Invalid PDF Unicode CMap stream");
      const source = Buffer.from(decodePDFRawStream(cmap).decode()).toString("ascii");
      const unicodeMap = new Map<string, string>();
      for (const block of source.matchAll(/beginbfchar([\s\S]*?)endbfchar/gu)) {
        for (const pair of block[1].matchAll(/<([\da-f]+)>\s*<([\da-f]+)>/giu)) {
          const bytes = Buffer.from(pair[2], "hex");
          unicodeMap.set(pair[1].toUpperCase(), new TextDecoder("utf-16be").decode(bytes));
        }
      }
      if (!unicodeMap.size) throw new Error("Unsupported or empty PDF Unicode CMap");
      unicodeFonts.set(name.toString(), unicodeMap);
    }
    const contents = page.node.Contents();
    const streams: PDFRawStream[] = [];
    if (contents instanceof PDFRawStream) streams.push(contents);
    else if (contents instanceof PDFArray) {
      for (let index = 0; index < contents.size(); index += 1) {
        streams.push(contents.lookup(index, PDFRawStream));
      }
    }

    for (const stream of streams) {
      const decoded = decodePDFRawStream(stream).decode();
      text.push(
        // Parse byte-preserving operands before applying the PDF font encoding.
        ...extractTextOperands(Buffer.from(decoded).toString("latin1"), unicodeFonts)
      );
    }
  }

  const result = text.join("\n").trim();
  if (!result) throw new Error("Expected decoded PDF content streams to contain text");
  return result;
}

export async function assertPdfDocument(
  bytes: Buffer
): Promise<{ pageCount: number }> {
  if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-", "ascii"))) {
    throw new Error("Expected PDF signature");
  }

  try {
    const pdf = await PDFDocument.load(bytes);
    const pageCount = pdf.getPageCount();
    if (pageCount < 1) throw new Error("PDF contains no pages");
    return { pageCount };
  } catch (error) {
    throw new Error("Expected a parseable PDF with at least one page", {
      cause: error,
    });
  }
}

function findEndOfCentralDirectory(bytes: Buffer): number {
  const lowerBound = Math.max(0, bytes.length - MAX_EOCD_SEARCH);
  for (let offset = bytes.length - 22; offset >= lowerBound; offset -= 1) {
    if (bytes.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY) return offset;
  }
  throw new Error("ZIP end-of-central-directory record not found");
}

function assertSafeMemberName(name: string): void {
  const segments = name.split("/");
  if (
    !name ||
    name.includes("\\") ||
    name.includes("\0") ||
    name.startsWith("/") ||
    /^[A-Za-z]:/u.test(name) ||
    segments.some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new Error(`Found unsafe ZIP member: ${name || "<empty>"}`);
  }
}

function centralDirectoryMembers(bytes: Buffer): string[] {
  const eocd = findEndOfCentralDirectory(bytes);
  const disk = bytes.readUInt16LE(eocd + 4);
  const centralDisk = bytes.readUInt16LE(eocd + 6);
  const entriesOnDisk = bytes.readUInt16LE(eocd + 8);
  const entryCount = bytes.readUInt16LE(eocd + 10);
  const centralSize = bytes.readUInt32LE(eocd + 12);
  const centralOffset = bytes.readUInt32LE(eocd + 16);

  if (
    disk !== 0 ||
    centralDisk !== 0 ||
    entriesOnDisk !== entryCount ||
    entryCount === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff
  ) {
    throw new Error("Unsupported multi-disk or ZIP64 archive");
  }
  if (centralOffset + centralSize > eocd) {
    throw new Error("Invalid ZIP central-directory bounds");
  }

  const names: string[] = [];
  const seen = new Set<string>();
  let offset = centralOffset;
  const decoder = new TextDecoder("utf-8", { fatal: true });

  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > bytes.length || bytes.readUInt32LE(offset) !== CENTRAL_FILE_HEADER) {
      throw new Error(`Invalid ZIP central-directory entry ${index}`);
    }
    const flags = bytes.readUInt16LE(offset + 8);
    if ((flags & 0x1) !== 0) throw new Error("Encrypted ZIP members are unsupported");

    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const end = offset + 46 + nameLength + extraLength + commentLength;
    if (end > bytes.length) throw new Error(`Truncated ZIP member ${index}`);

    let name: string;
    try {
      name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    } catch (error) {
      throw new Error(`ZIP member ${index} has an invalid UTF-8 name`, {
        cause: error,
      });
    }
    assertSafeMemberName(name.endsWith("/") ? name.slice(0, -1) : name);
    if (seen.has(name)) throw new Error(`Duplicate ZIP member: ${name}`);
    seen.add(name);
    names.push(name);
    offset = end;
  }

  if (offset !== centralOffset + centralSize) {
    throw new Error("ZIP central-directory size does not match its entries");
  }
  return names;
}

export async function inspectZipArchive(
  bytes: Buffer,
  expectedMembers: readonly string[]
): Promise<InspectedZipArchive> {
  if (bytes.length < 2 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error("Expected ZIP PK signature");
  }

  const rawMembers = centralDirectoryMembers(bytes);
  const files = [...rawMembers].sort();
  const expected = [...expectedMembers].sort();
  if (JSON.stringify(files) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected exact ZIP members ${JSON.stringify(expected)}, received ${JSON.stringify(files)}`
    );
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch (error) {
    throw new Error("Expected a readable ZIP archive", { cause: error });
  }

  const markdown = new Map<string, string>();
  const docxText = new Map<string, string>();
  const pdfText = new Map<string, string>();
  const pdfPages = new Map<string, number>();

  for (const name of files) {
    const entry = zip.file(name);
    if (!entry) throw new Error(`ZIP member disappeared during extraction: ${name}`);
    const content = await entry.async("nodebuffer");

    if (name.endsWith(".md")) {
      let decoded: string;
      try {
        decoded = new TextDecoder("utf-8", { fatal: true }).decode(content);
      } catch (error) {
        throw new Error(`Expected valid UTF-8 markdown in ${name}`, { cause: error });
      }
      if (decoded.trim().length === 0) {
        throw new Error(`Expected non-empty markdown in ${name}`);
      }
      markdown.set(name, decoded);
    } else if (name.endsWith(".docx")) {
      docxText.set(name, await extractDocxText(content));
    } else if (name.endsWith(".pdf")) {
      const parsed = await assertPdfDocument(content);
      pdfPages.set(name, parsed.pageCount);
      pdfText.set(name, await extractPdfText(content));
    }
  }

  return { members: files, markdown, docxText, pdfText, pdfPages };
}
