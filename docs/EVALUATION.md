# Evaluation report

Latest committed run: 8 October 2026 · suite `1.0.0`

| Metric | Observed |
| --- | ---: |
| Cases passed | 40 / 40 |
| Tool-selection accuracy | 100% |
| Retrieval Recall@5 | 100% |
| Citation attribution | 100% |
| p95 repository latency | 0.657 ms |

The suite covers ten simple document questions, eight multi-document questions, six structured record lookups, four ambiguous questions, four unavailable-information questions, four malformed/unauthorized cases, and four prompt-injection cases.

These numbers describe the deterministic local repository on the recorded machine. They do not measure an external model, network, Supabase staging instance, or production deployment. Run `npm run eval` to produce a timestamped detailed JSON report and refresh `evals/reports/latest.json`.
