import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { extractText } from "./ingestion.js";

describe("document extraction", () => {
  it("extracts plain text and strips null bytes", async () => {
    await expect(extractText(Buffer.from("Local\0 knowledge note"), "note.txt")).resolves.toBe("Local knowledge note");
  });

  it("extracts text runs from a DOCX container", async () => {
    const docx=zipSync({"word/document.xml":strToU8('<?xml version="1.0"?><w:document xmlns:w="urn:test"><w:body><w:p><w:r><w:t>Grounded</w:t></w:r><w:r><w:t> answer</w:t></w:r></w:p></w:body></w:document>')});
    await expect(extractText(Buffer.from(docx), "notes.docx")).resolves.toBe("Grounded answer");
  });

  it("rejects unsupported extensions and disguised DOCX files", async () => {
    await expect(extractText(Buffer.from("text"), "note.exe")).rejects.toThrow("UNSUPPORTED_FILE");
    await expect(extractText(Buffer.from("not a zip"), "note.docx")).rejects.toThrow("INVALID_FILE");
  });
});
