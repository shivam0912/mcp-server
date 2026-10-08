import type { KnowledgeDocument, KnowledgeRecord } from "@contextbridge/shared";
import { COLLECTION_ID } from "@contextbridge/shared";

const updatedAt = "2026-10-08T00:00:00.000Z";
const doc = (id: string, title: string, description: string, sections: Array<[string, string]>): KnowledgeDocument => ({
  id, collectionId: COLLECTION_ID, title, description, mimeType: "text/markdown", updatedAt,
  chunks: sections.map(([sectionTitle, content], index) => ({ id: `${id}-c${index + 1}`, documentId: id, sectionTitle, pageNumber: index + 1, content }))
});

export const documents: KnowledgeDocument[] = [
  doc("architecture-notes", "Software Architecture Notes", "System boundaries and deployment topology.", [
    ["System overview", "ContextBridge separates the Next.js web client, AI orchestration layer, MCP server, retrieval service, and PostgreSQL persistence. The AI layer never reads the database directly; it uses discovered MCP tools."],
    ["Transports", "Remote clients connect to the /mcp endpoint over Streamable HTTP. Local developer clients can launch the same server through stdio."],
    ["Reliability", "Tool loops are bounded, requests support cancellation, health checks are explicit, and keyword retrieval remains available when embeddings are unavailable."]
  ]),
  doc("authentication-design", "Authentication Design", "Authentication and collection authorization rules.", [
    ["Public demo", "The public demo uses a scoped bearer credential that grants read-only access only to the Computer Science Research Lab collection."],
    ["Administration", "Administrative actions require a separate server-side bearer credential. Production deployments should replace static development keys with Supabase Auth JWT verification and role-based policies."],
    ["Authorization", "Every MCP tool invocation resolves the caller scope before accessing documents. Collection identifiers supplied by clients are constraints, never grants."]
  ]),
  doc("database-schema", "Database Schema Overview", "Relational storage and tenant boundaries.", [
    ["Core entities", "Collections own documents and knowledge records. Documents own chunks. Chat sessions own messages and tool-call observations. Evaluation runs store aggregate metrics."],
    ["Search", "PostgreSQL full-text search uses a generated tsvector column and GIN index. pgvector stores embedding vectors and supports cosine-distance candidate retrieval."],
    ["Policies", "Row-level security policies bind authenticated users to collection membership. The service role is confined to the backend and is never exposed to browser code."]
  ]),
  doc("retrieval-fundamentals", "Information Retrieval Fundamentals", "Keyword, semantic, and hybrid retrieval.", [
    ["Keyword retrieval", "Keyword scoring rewards normalized query-term coverage and phrase matches. It is deterministic and remains the fallback when no embedding provider is configured."],
    ["Semantic retrieval", "Semantic retrieval embeds the query and compares it with stored chunk vectors using cosine similarity. Results must be labeled unavailable when embeddings cannot be generated."],
    ["Hybrid ranking", "Hybrid search combines normalized keyword and vector ranks, then deduplicates chunks and applies an explicit result limit. Recall at five is measured on labeled questions."]
  ]),
  doc("nlp-notes", "Natural Language Processing Notes", "Grounding and language-model orchestration.", [
    ["Tool selection", "The language model receives schemas discovered from the MCP server and chooses tools using structured arguments. The client validates iteration limits and sends tool results back to the model."],
    ["Grounding", "Final factual claims cite identifiers returned by retrieval. Citation validation rejects identifiers that were not present in tool results."],
    ["Prompt injection", "Retrieved text is treated as untrusted evidence. Instructions inside documents cannot override application policy or request secrets and tool access."]
  ]),
  doc("api-security", "API Security Guidelines", "Secure defaults for the web and MCP endpoints.", [
    ["Request controls", "Inputs are validated with Zod, body and upload sizes are bounded, CORS uses an origin allowlist, and rate limits protect public routes."],
    ["Content controls", "Uploaded filenames never become storage paths. Active content is not rendered inline. Output payloads and excerpts are capped."],
    ["Operations", "Secrets are supplied through environment variables, logs redact credentials and document bodies, and production traffic terminates TLS at the hosting edge."]
  ]),
  doc("project-timeline", "Project Development Timeline", "Phased implementation plan.", [
    ["Foundation", "The foundation phase establishes the monorepo, schemas, migration, CI, seeded demo content, and environment validation."],
    ["Core implementation", "The MCP and retrieval phases add protocol tools, resources, prompts, authorization, parsing, and hybrid search."],
    ["Delivery", "The final phases add the AI workspace, evaluation suite, security checks, deployment manifests, production smoke tests, and honest limitation reporting."]
  ]),
  doc("evaluation-report", "Experiment and Evaluation Report", "Evaluation methodology and baseline observations.", [
    ["Dataset", "The deterministic suite contains forty labeled cases spanning retrieval, record lookup, unavailable information, authorization, malformed arguments, and prompt injection."],
    ["Metrics", "The runner measures tool selection, contract validity, retrieval recall at five, citation attribution, unauthorized denials, and tool latency."],
    ["Interpretation", "Measured results must identify the exact suite version and execution environment. No metric is displayed until an actual run produces it."]
  ])
];

const makeRecord = (type: KnowledgeRecord["type"], n: number, title: string, topic: string): KnowledgeRecord => ({
  id: `${type}-${n.toString().padStart(2, "0")}`,
  collectionId: COLLECTION_ID,
  type,
  key: title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, ""),
  title,
  fields: { topic, status: "public demo", owner: "Computer Science Research Lab" }
});

export const records: KnowledgeRecord[] = [
  makeRecord("project", 1, "ContextBridge AI", "MCP and retrieval"),
  makeRecord("project", 2, "Campus Connect", "student collaboration"),
  makeRecord("project", 3, "Vector Search Benchmark", "information retrieval"),
  makeRecord("project", 4, "Secure Tool Gateway", "authorization"),
  makeRecord("project", 5, "Document Ingestion Pipeline", "data engineering"),
  makeRecord("project", 6, "Citation Validator", "grounded generation"),
  makeRecord("project", 7, "Evaluation Harness", "LLM evaluation"),
  makeRecord("course", 1, "Advanced Databases", "PostgreSQL and indexing"),
  makeRecord("course", 2, "Machine Learning", "supervised and unsupervised learning"),
  makeRecord("course", 3, "Natural Language Processing", "language models"),
  makeRecord("course", 4, "Information Retrieval", "ranking and evaluation"),
  makeRecord("course", 5, "Cloud Computing", "distributed deployment"),
  makeRecord("course", 6, "Software Architecture", "modular systems"),
  makeRecord("course", 7, "Application Security", "secure engineering"),
  makeRecord("research", 1, "Hybrid Search", "rank fusion"),
  makeRecord("research", 2, "Prompt Injection Defense", "LLM security"),
  makeRecord("research", 3, "Tool Selection Accuracy", "agent evaluation"),
  makeRecord("research", 4, "Grounded Generation", "citation attribution"),
  makeRecord("research", 5, "Embedding Quality", "semantic retrieval"),
  makeRecord("research", 6, "MCP Interoperability", "protocol engineering")
];
