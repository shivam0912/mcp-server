import { COLLECTION_ID, type SearchInput, type SearchResult } from "@contextbridge/shared";
import { documents, records } from "@contextbridge/retrieval/data";

const normalize = (value: string) => value.toLowerCase().normalize("NFKC").replaceAll(/[^a-z0-9\s]/g, " ").replaceAll(/\s+/g, " ").trim();
const stopwords = new Set(["a","an","and","are","as","at","be","by","do","does","for","from","how","i","in","is","it","me","of","on","or","that","the","this","to","use","uses","using","what","where","which","who","with"]);
const stem = (term: string) => term.replace(/(ations|ation|ating|ated)$/," ").trim().replace(/(ing|ed|es|s)$/," ").trim() || term;
const terms = (value: string) => [...new Set(normalize(value).split(" ").filter((term) => term.length > 1 && !stopwords.has(term)).map(stem))];

export class KnowledgeRepository {
  readonly collectionId = COLLECTION_ID;

  search(input: SearchInput): { results: SearchResult[]; search_mode_used: "keyword"; notice?: string } {
    this.assertCollection(input.collection_id);
    const queryTerms = terms(input.query);
    const normalizedQuery = normalize(input.query);
    const ranked = documents.flatMap((document) => document.chunks.map((chunk) => {
      const haystack = terms(`${document.title} ${chunk.sectionTitle} ${chunk.content}`);
      const matched = queryTerms.filter((term) => haystack.some((token) => token === term || (token.length >= 3 && term.length >= 3 && (token.startsWith(term) || term.startsWith(token)))));
      const titleTerms = terms(document.title);
      const titleMatches = queryTerms.filter((term) => titleTerms.some((token) => token === term || (token.length >= 3 && term.length >= 3 && (token.startsWith(term) || term.startsWith(token)))));
      const coverage = queryTerms.length ? matched.length / queryTerms.length : 0;
      const titleCoverage = queryTerms.length ? titleMatches.length / queryTerms.length : 0;
      const phrase = normalizedQuery.length > 3 && normalize(`${document.title} ${chunk.sectionTitle} ${chunk.content}`).includes(normalizedQuery) ? 0.35 : 0;
      return { document, chunk, score: Math.min(1, coverage * 0.65 + titleCoverage * 0.25 + phrase) };
    })).filter(({ score }) => score >= 0.2)
      .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id))
      .slice(0, input.limit);

    const results = ranked.map(({ document, chunk, score }) => ({
      document_id: document.id,
      document_title: document.title,
      chunk_id: chunk.id,
      excerpt: chunk.content.slice(0, 420),
      relevance_score: Number(score.toFixed(4)),
      page: chunk.pageNumber,
      section: chunk.sectionTitle,
      citation_id: `${document.id}#${chunk.id}`
    }));

    return {
      results,
      search_mode_used: "keyword",
      ...(input.search_mode !== "keyword" ? { notice: "Embeddings are not configured in local demo mode; deterministic keyword retrieval was used." } : {})
    };
  }

  getDocument(documentId: string, sectionId?: string, chunkId?: string) {
    const document = documents.find((item) => item.id === documentId);
    if (!document) return undefined;
    const selected = document.chunks.filter((chunk) => !chunkId || chunk.id === chunkId).filter((chunk) => !sectionId || normalize(chunk.sectionTitle) === normalize(sectionId));
    if ((chunkId || sectionId) && selected.length === 0) return undefined;
    return {
      document: { id: document.id, title: document.title, description: document.description, mime_type: document.mimeType, updated_at: document.updatedAt },
      sections: selected.map((chunk) => ({ chunk_id: chunk.id, section: chunk.sectionTitle, page: chunk.pageNumber, content: chunk.content, citation_id: `${document.id}#${chunk.id}` })),
      truncated: false
    };
  }

  lookupRecord(type: "project" | "course" | "research", id: string) {
    const needle = normalize(id);
    return records.find((record) => record.type === type && (normalize(record.id) === needle || normalize(record.key) === needle || normalize(record.title) === needle));
  }

  overview() {
    return {
      id: COLLECTION_ID,
      name: "Computer Science Research Lab",
      description: "A fictional, public demo collection for MCP retrieval and evaluation.",
      document_count: documents.length,
      supported_record_types: ["project", "course", "research"],
      topics: ["MCP", "information retrieval", "NLP", "application security", "PostgreSQL", "LLM evaluation"],
      last_successful_ingestion: "2026-10-08T00:00:00.000Z"
    };
  }

  listDocuments() { return documents.map(({ chunks: ignored, ...metadata }) => ({ ...metadata, chunkCount: ignored.length })); }

  private assertCollection(collectionId?: string) {
    if (collectionId && collectionId !== COLLECTION_ID) throw new Error("FORBIDDEN_COLLECTION");
  }
}

export { documents, records } from "@contextbridge/retrieval/data";
