# MCP Server — ContextBridge AI

**ContextBridge AI** is a portfolio application for **MCP Server**: a genuine Model Context Protocol knowledge server and evidence-grounded document assistant using the official MCP TypeScript SDK v2.

The repository is designed to work without cloud credentials. SQLite persists uploads, indexed chunks, records, and MCP activity inside the project. The public demo includes eight original documents and twenty structured records, deterministic keyword retrieval, a transparent local answer path, and a 40-case evaluation suite.

## What works

- Real MCP tool discovery and execution: `search_documents`, `get_document`, `lookup_record`, `get_collection_overview`.
- MCP resources for all demo documents and collection metadata.
- `answer_with_evidence` MCP prompt.
- Streamable HTTP endpoint at `/mcp` and local stdio transport.
- Next.js pages for home, AI workspace, live knowledge library, functional local administration, evaluations, and developer docs.
- Actual MCP client invocation in the web chat route; there is no REST shortcut around MCP.
- Source identifiers, missing-information behavior, prompt-injection boundaries, bearer auth, origin validation, rate limits, bounded inputs, and security headers.
- Safe PDF, DOCX, TXT, and Markdown ingestion with offline OCR for scanned PDFs, checksums, duplicate detection, 10 MB limits, re-indexing, and deletion.
- SQLite local persistence by default, plus optional PostgreSQL/pgvector migrations, Docker artifacts, deployment configuration, CI, tests, and deterministic evaluation.

## Quick start

Requirements: Node.js 22+ and npm 10+.

```bash
git clone https://github.com/shivam0912/contextbridge-ai.git
cd contextbridge-ai
cp .env.example .env
npm install --legacy-peer-deps
npm run setup
npm run dev
```

Open `http://localhost:3000`. The MCP service listens on `http://127.0.0.1:8787/mcp`; health is at `/health`.

The repository includes `.vscode/mcp.json`. After `npm run dev`, VS Code can discover the same ContextBridge tools used by the web workspace. MCP does not expose the whole computer: the server can access only its seeded records and files explicitly imported through Admin.

To deliberately clear local uploads and restore only the seeded collection, stop the dev servers and run `npm run reset -- --yes`.

If `MCP_API_KEY` is set, use the same value for the web and MCP processes. No API key, Supabase account, Docker service, or cloud database is needed for local use. Open **Admin** to upload a document, then ask about it in **Workspace**. All retrieval still travels through a genuine MCP client and server.

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
data                     generated SQLite database and uploaded files (Git-ignored)
evals                    40 labeled scenarios and timestamped reports
supabase/migrations      PostgreSQL, pgvector, indexes, constraints, and RLS
docs                     architecture, security, tool reference, and status
```

## Local-first and production boundary

The clone-and-run experience is complete with SQLite. Local administration is restricted to loopback requests when no `ADMIN_API_KEY` is configured; production refuses that fallback. A hosted multi-user deployment should configure `ADMIN_API_KEY` or JWT authentication and replace local files with durable storage. Semantic search reports its keyword fallback explicitly when embeddings are unavailable. The source is public at [github.com/shivam0912/contextbridge-ai](https://github.com/shivam0912/contextbridge-ai); no hosted live demo is claimed. See `docs/IMPLEMENTATION_STATUS.md`.

## License

MIT. The MCP SDK has its own upstream licensing terms.
