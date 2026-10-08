# Implementation status

Updated: 8 October 2026

## Complete and verified locally

- Monorepo, strict TypeScript, lockfile, CI, environment template, license.
- Official MCP SDK v2 server with four tools, eight document resources, collection resource, evidence prompt, Streamable HTTP, and stdio.
- Independent stdio client handshake, tool discovery, and tool execution.
- SQLite persistence with eight seeded documents, twenty records, uploaded document metadata, chunks, checksums, and tool observations.
- Functional local upload, extraction (PDF/DOCX/TXT/MD), offline OCR fallback for scanned PDFs, duplicate detection, re-index, delete, and live knowledge-library refresh.
- Deterministic ranked retrieval, explicit semantic fallback, citations, authorization boundary, structured tool errors.
- Six responsive Next.js pages, persistent light/dark appearance, independently scrolling chat panes, and an MCP-backed chat route.
- OpenAI-compatible model-selected MCP tool calls and grounded synthesis when configured, with deterministic local tool planning and evidence composition as the credential-free fallback.
- PostgreSQL/pgvector schema, indexes, constraints, and RLS policies.
- Forty-case deterministic evaluation runner with JSON reports.
- Docker, Compose, Render, Vercel, GitHub Actions, security notes, and secret scan.

## Optional hosted enhancements

- Supabase project and object storage if the application is deployed across ephemeral cloud services; these are not required locally.
- Embedding provider and stored vectors for real semantic retrieval.
- Identity provider/JWT verification for multi-user administrator login.
- Provider credentials are optional; without them the transparent deterministic planner is used.
- Vercel/Render/GitHub accounts and credentials for live deployment/publication.
- Production-domain origin allowlist, TLS edge, monitoring sink, and distributed rate limiter.

These items require external infrastructure. The local application does not fake them.
