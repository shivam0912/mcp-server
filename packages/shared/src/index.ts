import * as z from "zod/v4";

export const COLLECTION_ID = "cs-research-lab";

export const searchInputSchema = z.object({
  query: z.string().trim().min(1).max(500),
  collection_id: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(10).default(5),
  search_mode: z.enum(["keyword", "semantic", "hybrid"]).default("hybrid")
});

export const getDocumentInputSchema = z.object({
  document_id: z.string().trim().min(1).max(128),
  section_id: z.string().trim().min(1).max(128).optional(),
  chunk_id: z.string().trim().min(1).max(128).optional()
});

export const lookupRecordInputSchema = z.object({
  record_type: z.enum(["project", "course", "research"]),
  record_id: z.string().trim().min(1).max(128)
});

export const overviewInputSchema = z.object({});

export type SearchInput = z.infer<typeof searchInputSchema>;
export type SearchMode = SearchInput["search_mode"];
export type RecordType = "project" | "course" | "research";

export interface DocumentChunk {
  id: string;
  documentId: string;
  sectionTitle: string;
  pageNumber: number;
  content: string;
}

export interface KnowledgeDocument {
  id: string;
  collectionId: string;
  title: string;
  description: string;
  mimeType: string;
  updatedAt: string;
  chunks: DocumentChunk[];
}

export interface KnowledgeRecord {
  id: string;
  collectionId: string;
  type: RecordType;
  key: string;
  title: string;
  fields: Record<string, string | number | string[]>;
}

export interface SearchResult {
  document_id: string;
  document_title: string;
  chunk_id: string;
  excerpt: string;
  relevance_score: number;
  page: number;
  section: string;
  citation_id: string;
}

export const errorResult = (code: string, message: string) => ({
  content: [{ type: "text" as const, text: JSON.stringify({ error: { code, message } }) }],
  structuredContent: { error: { code, message } },
  isError: true
});

export const textResult = (value: Record<string, unknown>) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  structuredContent: value
});
