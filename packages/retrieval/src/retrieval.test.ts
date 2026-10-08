import { describe, expect, it } from "vitest";
import { KnowledgeRepository } from "./index.js";

describe("KnowledgeRepository", () => {
  const repository = new KnowledgeRepository();
  it("ranks authentication evidence deterministically", () => {
    const first = repository.search({ query: "authentication bearer credential", limit: 5, search_mode: "hybrid" });
    const second = repository.search({ query: "authentication bearer credential", limit: 5, search_mode: "hybrid" });
    expect(first.results[0]?.document_id).toBe("authentication-design");
    expect(second).toEqual(first);
  });
  it("resolves the public demo authentication user journey", () => {
    const result = repository.search({ query: "Which authentication mechanism does this project use?", limit: 5, search_mode: "hybrid" });
    expect(result.results[0]?.document_id).toBe("authentication-design");
  });
  it("returns empty results for unavailable information", () => {
    expect(repository.search({ query: "quantum banana telescope", limit: 5, search_mode: "keyword" }).results).toEqual([]);
  });
  it("finds exact structured records", () => {
    expect(repository.lookupRecord("project", "ContextBridge AI")?.id).toBe("project-01");
  });
  it("rejects unauthorized collections", () => {
    expect(() => repository.search({ query: "test", collection_id: "private", limit: 5, search_mode: "keyword" })).toThrow("FORBIDDEN_COLLECTION");
  });
});
