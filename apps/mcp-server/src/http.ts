import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { authenticateAdmin, authenticateMcp } from "./auth.js";
import { createContextBridgeServer, repository } from "./server.js";
import { deleteUpload, ingestUpload, maxUploadBytes, reindexUpload } from "./ingestion.js";

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
app.get("/documents", (_request, response) => response.json({ documents: repository.listDocuments(), collection: repository.overview() }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxUploadBytes, files: 1, fields: 2, fieldSize: 2_048 } });
app.get("/admin/documents", authenticateAdmin, (_request, response) => response.json({ documents: repository.listDocuments(), collection: repository.overview() }));
app.post("/admin/documents", authenticateAdmin, upload.single("file"), async (request, response, next) => {
  try { if (!request.file) return response.status(400).json({ error: { code: "FILE_REQUIRED", message: "Choose a PDF, DOCX, TXT, or MD file." } }); response.status(201).json({ document: await ingestUpload(repository, request.file, typeof request.body.title === "string" ? request.body.title : undefined) }); }
  catch (error) { next(error); }
});
app.post("/admin/documents/:id/reindex", authenticateAdmin, async (request, response, next) => { try { response.json({ document: await reindexUpload(repository, String(request.params.id)) }); } catch (error) { next(error); } });
app.delete("/admin/documents/:id", authenticateAdmin, async (request, response, next) => { try { await deleteUpload(repository, String(request.params.id)); response.status(204).send(); } catch (error) { next(error); } });
app.get("/admin/activity", authenticateAdmin, (_request, response) => response.json({ activity: repository.activity() }));

const mcpHandler = createMcpHandler(() => createContextBridgeServer());
app.all("/mcp", authenticateMcp, toNodeHandler(mcpHandler));

app.use((_request, response) => response.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found." } }));
app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error("Request failed", error instanceof Error ? error.message : "Unknown error");
  if (error instanceof multer.MulterError) return response.status(400).json({ error: { code: error.code, message: error.code === "LIMIT_FILE_SIZE" ? "The file is larger than the 10 MB limit." : "The upload was rejected." } });
  const code=error instanceof Error?error.message:"INTERNAL_ERROR";
  const known:Record<string,[number,string]>={UNSUPPORTED_FILE:[415,"Use a valid PDF, DOCX, TXT, or MD file up to 10 MB."],INVALID_FILE:[400,"The file contents do not match the selected format."],EMPTY_DOCUMENT:[422,"No readable text was found in this document."],DUPLICATE_DOCUMENT:[409,"This exact document is already in the collection."],NOT_FOUND:[404,"The uploaded document was not found."]};
  const mapped=known[code];response.status(mapped?.[0]??500).json({ error: { code, message:mapped?.[1]??"The request could not be completed." } });
});

const httpServer = app.listen(port, "127.0.0.1", () => console.log(`ContextBridge MCP listening on http://127.0.0.1:${port}/mcp`));
httpServer.requestTimeout = 30_000;
httpServer.headersTimeout = 35_000;
httpServer.on("error", (error) => console.error("HTTP server error", error.message));
