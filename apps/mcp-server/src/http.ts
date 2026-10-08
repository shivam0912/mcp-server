import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { authenticateMcp } from "./auth.js";
import { createContextBridgeServer } from "./server.js";

const port = Number(process.env.PORT ?? 8787);
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS ?? "http://localhost:3000").split(",").map((value) => value.trim()).filter(Boolean));
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false }));

app.use((request, response, next) => {
  const origin = request.header("origin");
  if (origin && !allowedOrigins.has(origin)) return response.status(403).json({ error: { code: "ORIGIN_DENIED", message: "Origin is not allowed." } });
  if (origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Headers", "authorization, content-type, mcp-protocol-version, mcp-session-id");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  }
  if (request.method === "OPTIONS") return response.sendStatus(204);
  next();
});

app.get("/health", (_request, response) => response.json({ status: "ok", service: "contextbridge-mcp", version: "1.0.0" }));

const mcpHandler = createMcpHandler(() => createContextBridgeServer());
app.all("/mcp", authenticateMcp, toNodeHandler(mcpHandler));

app.use((_request, response) => response.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found." } }));
app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error("Request failed", error instanceof Error ? error.message : "Unknown error");
  response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "The request could not be completed." } });
});

const httpServer = app.listen(port, "127.0.0.1", () => console.log(`ContextBridge MCP listening on http://127.0.0.1:${port}/mcp`));
httpServer.requestTimeout = 30_000;
httpServer.headersTimeout = 35_000;
httpServer.on("error", (error) => console.error("HTTP server error", error.message));
