import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const url = new URL(process.env.MCP_URL ?? "http://127.0.0.1:8787/mcp");
const headers: Record<string, string> = {};
if (process.env.MCP_API_KEY) headers.Authorization = `Bearer ${process.env.MCP_API_KEY}`;
const client = new Client({ name: "contextbridge-http-interop", version: "1.0.0" });

try {
  await client.connect(new StreamableHTTPClientTransport(url, { requestInit: { headers } }));
  const [tools, resources, prompts] = await Promise.all([client.listTools(), client.listResources(), client.listPrompts()]);
  const search = await client.callTool({ name: "search_documents", arguments: { query: "Which authentication mechanism does this project use?", collection_id: "cs-research-lab", limit: 3, search_mode: "hybrid" } });
  if (search.isError) throw new Error("HTTP tool invocation failed");
  console.log(JSON.stringify({
    protocol: "MCP",
    transport: "Streamable HTTP",
    endpoint: url.toString(),
    tools: tools.tools.map((tool) => tool.name),
    resourceCount: resources.resources.length,
    prompts: prompts.prompts.map((prompt) => prompt.name),
    result: search.structuredContent
  }, null, 2));
} finally {
  await client.close();
}
