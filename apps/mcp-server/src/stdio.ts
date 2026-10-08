import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { createContextBridgeServer } from "./server.js";

const server = createContextBridgeServer();
await server.connect(new StdioServerTransport());
