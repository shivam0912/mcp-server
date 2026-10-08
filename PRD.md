# MCP Server — ContextBridge AI Product Requirements

Version 1.0 · MCP Server / AI Knowledge Assistant

## Product

Build a production-oriented knowledge assistant around a real Model Context Protocol server. The AI client discovers tools, submits validated arguments through MCP, receives authorized evidence, and produces answers that cite identifiers actually returned by retrieval.

## Required capabilities

- Official MCP TypeScript SDK v2 with Streamable HTTP and stdio.
- Read-only document search, document retrieval, structured record lookup, and collection overview tools.
- Stable read-only resources and an `answer_with_evidence` prompt.
- Keyword, semantic, and hybrid retrieval contracts with explicit fallback behavior.
- Public seeded demo and protected administrative boundary.
- Next.js home, chat, knowledge, admin, evaluations, and docs pages.
- Input/output validation, authorization, structured errors, bounded outputs, origin checks, rate limiting, and prompt-injection mitigation.
- A provider abstraction for an OpenAI-compatible language model.
- PostgreSQL/pgvector migration, object-storage-ready document metadata, RLS, CI, containers, deployment configuration, documentation, and a reproducible seed.
- Forty labeled evaluation cases covering ordinary questions, multi-document questions, records, ambiguity, missing information, malformed/unauthorized requests, and prompt injection.

## Acceptance targets

- All deterministic tests satisfy tool contracts.
- All unauthorized deterministic cases are denied.
- Tool selection accuracy ≥90%.
- Retrieval Recall@5 ≥85%.
- Citation attribution ≥90%.
- No fabricated identifiers in deterministic verification.
- Database-only p95 tool latency below one second in the tested environment.

## Delivery integrity

Never claim a deployment, repository publication, test pass, semantic result, or metric that was not observed. Document unavailable external verification and credentials as limitations rather than substituting mock production behavior.
