import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { unzipSync } from "fflate";
import { PDFParse } from "pdf-parse";
import { defaultDataDirectory, type KnowledgeRepository } from "@contextbridge/retrieval";

const supported = new Set([".pdf", ".docx", ".txt", ".md"]);
const xmlEntities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

export const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);
export const uploadDirectory = resolve(process.env.CONTEXTBRIDGE_FILES_PATH ?? defaultDataDirectory, "files");

function decodeXml(value: string) {
  return value.replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (_match, entity: string) => xmlEntities[entity] ?? "");
}

export async function extractText(buffer: Buffer, filename: string) {
  const extension = extname(filename).toLowerCase();
  if (!supported.has(extension)) throw new Error("UNSUPPORTED_FILE");
  if (extension === ".txt" || extension === ".md") return buffer.toString("utf8").replaceAll("\0", "").trim();
  if (extension === ".pdf") {
    if (buffer.subarray(0, 5).toString() !== "%PDF-") throw new Error("INVALID_FILE");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try { return (await parser.getText()).text.trim(); } finally { await parser.destroy(); }
  }
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) throw new Error("INVALID_FILE");
  const files = unzipSync(new Uint8Array(buffer));
  const document = files["word/document.xml"];
  if (!document || document.byteLength > 50 * 1024 * 1024) throw new Error("INVALID_FILE");
  const xml = new TextDecoder().decode(document);
  return [...xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((match) => decodeXml(match[1] ?? "")).join(" ").replaceAll(/\s+/g, " ").trim();
}

export async function ingestUpload(repository: KnowledgeRepository, file: Express.Multer.File, requestedTitle?: string) {
  const extension = extname(file.originalname).toLowerCase();
  if (!supported.has(extension) || file.size > maxUploadBytes) throw new Error("UNSUPPORTED_FILE");
  const checksum = createHash("sha256").update(file.buffer).digest("hex");
  const duplicate = repository.findByChecksum(checksum);
  if (duplicate) throw new Error("DUPLICATE_DOCUMENT");
  const text = await extractText(file.buffer, file.originalname);
  if (!text.trim()) throw new Error("EMPTY_DOCUMENT");
  const id = `upload-${randomUUID()}`;
  const safeTitle = (requestedTitle?.trim() || file.originalname.replace(/\.[^.]+$/, "")).slice(0, 160);
  await mkdir(uploadDirectory, { recursive: true });
  const filePath = resolve(uploadDirectory, `${id}${extension}`);
  await writeFile(filePath, file.buffer, { flag: "wx" });
  try {
    return repository.ingestDocument({ id, title: safeTitle, description: `Locally uploaded ${extension.slice(1).toUpperCase()} document.`, filePath, mimeType: file.mimetype || "application/octet-stream", checksum, text });
  } catch (error) {
    await unlink(filePath).catch(() => undefined);
    throw error;
  }
}

export async function reindexUpload(repository: KnowledgeRepository, documentId: string) {
  const document = repository.getStoredDocument(documentId);
  if (!document?.file_path) throw new Error("NOT_FOUND");
  const buffer = await readFile(document.file_path);
  return repository.replaceDocumentText(documentId, await extractText(buffer, document.file_path));
}

export async function deleteUpload(repository: KnowledgeRepository, documentId: string) {
  const document = repository.deleteUploadedDocument(documentId);
  if (!document) throw new Error("NOT_FOUND");
  if (document.file_path) await unlink(document.file_path).catch(() => undefined);
  return document;
}
