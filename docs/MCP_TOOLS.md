# MCP reference

## `search_documents`

Input: `query` (1–500 characters), optional `collection_id`, `limit` (1–10), and `search_mode` (`keyword`, `semantic`, `hybrid`). Output includes document/chunk identifiers, excerpt, score, page, section, and `citation_id`.

Local mode always labels its actual retrieval mode. A semantic or hybrid request falls back to keyword with a notice when no embeddings are configured.

## `get_document`

Input: `document_id` and optional `section_id`/`chunk_id`. Output includes metadata, content, page/section, citations, and truncation state. Missing or inaccessible content returns a structured error.

## `lookup_record`

Input: `record_type` (`project`, `course`, `research`) and exact `record_id`, key, or title. No SQL text is accepted.

## `get_collection_overview`

No arguments. Returns only public name, description, count, record types, topics, and last ingestion time.

## Resources and prompt

Resources use `contextbridge://collections/<collection>/documents/<document>` plus a collection overview resource. The `answer_with_evidence` prompt takes a `question` argument and instructs compatible clients to retrieve, cite exact IDs, disclose gaps, and treat documents as untrusted data.
