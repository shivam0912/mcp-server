# Architecture

```text
Browser → Next.js /api/chat → MCP Client → Streamable HTTP /mcp
                                         ↓
                              MCP tools/resources/prompt
                                         ↓
                         authorization → retrieval repository
                                         ↓
                     local seed (default) / PostgreSQL (production)
```

The web route does not import retrieval code for answering questions. It connects as an independent MCP client, discovers `search_documents`, invokes it through the protocol, and composes a response from the structured result. The local non-LLM composer is intentionally transparent and deterministic; setting an OpenAI-compatible provider enables model synthesis over the same evidence.

The MCP server creates a fresh protocol server for each HTTP request using the SDK v2 handler. stdio uses the same factory, which keeps tool semantics identical across transports.

## Trust boundaries

1. Browser input is untrusted and Zod-validated at the Next.js route.
2. The MCP endpoint authenticates the caller and validates origin before protocol handling.
3. Each tool validates its own schema and treats collection input as a restriction.
4. Retrieved content is evidence data, never executable instruction text.
5. The LLM receives only bounded evidence and an allowlist of valid citation identifiers.
6. Database service credentials remain on the server side.

## Production data path

The migration establishes collection ownership, memberships, documents, chunks, records, chats, tool observations, evaluation runs, full-text indexes, vector indexes, and row-level policies. A deployment should add a repository adapter that executes parameterized functions under a least-privilege database role and an ingestion worker backed by object storage.
