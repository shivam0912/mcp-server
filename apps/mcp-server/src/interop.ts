import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const client = new Client({ name: "contextbridge-interop-test", version: "1.0.0" });
const transport = new StdioClientTransport({ command: process.execPath, args: ["--import", "tsx", new URL("./stdio.ts", import.meta.url).pathname] });
try {
  await client.connect(transport);
  const tools = await client.listTools();
  const result = await client.callTool({ name: "search_documents", arguments: { query: "authentication mechanism", limit: 3, search_mode: "keyword" } });
  if (!tools.tools.some((tool) => tool.name === "search_documents")) throw new Error("search_documents was not discovered");
  if (result.isError) throw new Error("search_documents returned an error");
  console.log(JSON.stringify({ protocol: "MCP", transport: "stdio", tools: tools.tools.map((tool) => tool.name), search: result.structuredContent }, null, 2));
} finally {
  await client.close();
}
