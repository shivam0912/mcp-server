import { afterAll, describe, expect, it } from "vitest";
import { KnowledgeRepository } from "./index.js";

describe("KnowledgeRepository", () => {
  const repository = new KnowledgeRepository({ databasePath: ":memory:" });
  afterAll(() => repository.close());
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
  it("indexes uploaded text and exposes it through retrieval", () => {
    repository.ingestDocument({id:"upload-test",title:"Robotics Notes",description:"Test",filePath:"/tmp/test.txt",mimeType:"text/plain",checksum:"test-checksum",text:"The rover uses lidar mapping and autonomous path planning."});
    expect(repository.search({query:"lidar mapping",limit:5,search_mode:"keyword"}).results[0]?.document_id).toBe("upload-test");
    expect(repository.listDocuments().find(document=>document.id==="upload-test")?.chunkCount).toBe(1);
    expect(repository.overview().documents.some(document=>document.title==="Robotics Notes")).toBe(true);
  });
  it("centers excerpts around matching evidence in long chunks", () => {
    repository.ingestDocument({id:"upload-long",title:"Long Recommendation",description:"Test",filePath:"/tmp/long.txt",mimeType:"text/plain",checksum:"long-checksum",text:`${"general introduction ".repeat(35)}The MCP Server major project demonstrated research aptitude and hands-on experimentation. ${"closing note ".repeat(35)}`});
    const result=repository.search({query:"MCP Server project",limit:5,search_mode:"keyword"}).results.find(item=>item.document_id==="upload-long");
    expect(result?.excerpt).toContain("MCP Server major project");
    expect(result?.excerpt.startsWith("…")).toBe(true);
  });
});
