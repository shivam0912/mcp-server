# ContextBridge AI

ContextBridge AI is a genuine Model Context Protocol knowledge server and evidence-grounded document assistant. It uses the official MCP TypeScript SDK v2, exposes tools/resources/prompts over Streamable HTTP and stdio, and includes a Next.js interface with an inspectable tool trace.

The repository is designed to be useful without cloud credentials: the local public demo includes eight original documents and twenty structured records, deterministic keyword retrieval, a transparent non-LLM answer path, and a 40-case evaluation suite. Supabase, pgvector, and an OpenAI-compatible provider are production options rather than hidden requirements.

## What works

- Real MCP tool discovery and execution: `search_documents`, `get_document`, `lookup_record`, `get_collection_overview`.
- MCP resources for all demo documents and collection metadata.
- `answer_with_evidence` MCP prompt.
- Streamable HTTP endpoint at `/mcp` and local stdio transport.
- Next.js pages for home, AI workspace, knowledge library, administration readiness, evaluations, and developer docs.
- Actual MCP client invocation in the web chat route; there is no REST shortcut around MCP.
- Source identifiers, missing-information behavior, prompt-injection boundaries, bearer auth, origin validation, rate limits, bounded inputs, and security headers.
- PostgreSQL/pgvector schema, RLS policies, Docker artifacts, Render/Vercel configuration, CI, tests, and deterministic evaluation.

## Quick start

Requirements: Node.js 22+ and npm 10+.

```bash
cp .env.example .env
npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:3000`. The MCP service listens on `http://127.0.0.1:8787/mcp`; health is at `/health`.

If `MCP_API_KEY` is set, use the same value for the web and MCP processes. When no LLM key is present, the workspace uses a transparent local evidence composer, but retrieval still travels through a genuine MCP client and server.

## Verification

```bash
npm run typecheck
npm test
npm run test:interop -w @contextbridge/mcp-server
npm run eval
npm run build
npm audit --omit=dev
npm run secret-scan
```

The interoperability command launches the server through stdio, performs the MCP handshake, discovers all tools, calls `search_documents`, and prints the structured result.

## MCP client configuration

Stdio example:

```json
{
  "mcpServers": {
    "contextbridge": {
      "command": "node",
      "args": ["--import", "tsx", "/absolute/path/contextbridge-ai/apps/mcp-server/src/stdio.ts"]
    }
  }
}
```

HTTP clients connect to `http://localhost:8787/mcp` using Streamable HTTP and, when configured, `Authorization: Bearer <MCP_API_KEY>`.

## Repository map

```text
apps/web                 Next.js interface and MCP-backed chat route
apps/mcp-server          MCP server, HTTP transport, stdio transport, interop proof
packages/shared          Zod schemas and shared contracts
packages/retrieval       deterministic local repository and seeded demo collection
evals                    40 labeled scenarios and timestamped reports
supabase/migrations      PostgreSQL, pgvector, indexes, constraints, and RLS
docs                     architecture, security, tool reference, and status
```

## Honest production boundary

Cloud deployment and GitHub publication require accounts and credentials that are not present in this workspace, so no live URL or remote repository is claimed. The admin interface remains locked until persistent storage and an administrator identity provider are configured. Semantic search reports its fallback explicitly when embeddings are unavailable. See `docs/IMPLEMENTATION_STATUS.md`.

## License

MIT. The MCP SDK has its own upstream licensing terms.
