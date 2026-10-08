import type { RequestHandler } from "express";
import { timingSafeEqual } from "node:crypto";

const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

export const authenticateMcp: RequestHandler = (request, response, next) => {
  const configured = process.env.MCP_API_KEY;
  if (!configured && process.env.NODE_ENV !== "production") return next();
  if (!configured) return response.status(503).json({ error: { code: "SERVER_MISCONFIGURED", message: "MCP authentication is not configured." } });
  const header = request.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !safeEqual(token, configured)) return response.status(401).json({ error: { code: "UNAUTHORIZED", message: "A valid bearer credential is required." } });
  next();
};

export const authenticateAdmin: RequestHandler = (request, response, next) => {
  const configured = process.env.ADMIN_API_KEY;
  const remote = request.socket.remoteAddress ?? "";
  const localRequest = remote === "127.0.0.1" || remote === "::1" || remote === "::ffff:127.0.0.1";
  if (!configured && process.env.NODE_ENV !== "production" && localRequest) return next();
  if (!configured) return response.status(503).json({ error: { code: "ADMIN_NOT_CONFIGURED", message: "Set ADMIN_API_KEY to enable administration outside local development." } });
  const header = request.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !safeEqual(token, configured)) return response.status(401).json({ error: { code: "UNAUTHORIZED", message: "A valid administrator credential is required." } });
  next();
};
