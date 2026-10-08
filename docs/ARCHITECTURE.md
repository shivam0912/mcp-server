# Architecture

```text
Browser chat / VS Code → MCP Client → Streamable HTTP /mcp
                                         ↓
                              MCP tools/resources/prompt
                                         ↓
                         authorization → retrieval repository
                                         ↓
                       SQLite (default) / PostgreSQL (hosted option)
```

The web route does not import retrieval code for answering questions. It connects as an independent MCP client and discovers tools. A configured OpenAI-compatible model receives the discovered schemas and selects a tool; without credentials, a transparent deterministic planner chooses among overview, record lookup, document retrieval, and search. The selected call always executes through MCP.

The MCP server creates a fresh protocol server for each HTTP request using the SDK v2 handler. stdio uses the same factory, which keeps tool semantics identical across transports.

MCP is the standardized boundary between an AI client and capabilities exposed by the server. It does not grant blanket computer access. ContextBridge exposes four narrow read-only tools over its own SQLite collection and files explicitly imported through Admin. The tracked `.vscode/mcp.json` lets VS Code use the same running server.

## Trust boundaries

1. Browser input is untrusted and Zod-validated at the Next.js route.
2. The MCP endpoint authenticates the caller and validates origin before protocol handling.
3. Each tool validates its own schema and treats collection input as a restriction.
4. Retrieved content is evidence data, never executable instruction text.
5. The LLM receives only bounded evidence and an allowlist of valid citation identifiers.
6. Database service credentials remain on the server side.

## Persistence and production data path

SQLite is created automatically in `data/contextbridge.sqlite`; uploaded files are stored under `data/files`. Both paths are ignored by Git. The included PostgreSQL migration establishes collection ownership, memberships, documents, chunks, records, chats, tool observations, evaluation runs, full-text indexes, vector indexes, and row-level policies for a future multi-user hosted adapter.
