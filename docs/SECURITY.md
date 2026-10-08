# Security considerations

- MCP HTTP uses bearer authentication when `MCP_API_KEY` is configured and refuses production startup requests when it is absent.
- Admin credentials and Supabase service-role keys are server-only environment variables.
- Inputs are strict Zod schemas; request, excerpt, result, and upload limits are bounded.
- Allowed browser origins are explicit. CORS never combines a wildcard origin with credentials.
- Helmet headers, custom errors, disabled framework fingerprinting, rate limits, and HTTP timeouts are enabled.
- No shell execution or user-controlled filesystem path is used for document processing.
- The SQL design uses UUIDs, constraints, parameterization boundaries, least privilege, and row-level security.
- Uploaded active content must be stored outside the public web root and served as attachment; browser previews must never inject raw HTML or SVG.
- Retrieved content is not placed into raw HTML and cannot change system policy. The LLM prompt receives an exact citation allowlist.
- Authentication in this repository uses an Authorization header rather than cookies, so classic browser CSRF is not applicable to MCP calls. If cookie authentication is later added, state-changing routes require CSRF tokens.
- TLS is expected at the deployment edge; local development intentionally uses HTTP on loopback.

Before production: replace the shared demo credential with verified short-lived JWTs, configure exact proxy trust for the chosen host, add persistent distributed rate limiting, implement malware scanning for uploads, and verify runtime response headers at the edge.
