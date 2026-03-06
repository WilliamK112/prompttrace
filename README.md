# PromptTrace

PromptTrace gives LLM apps a black-box recorder: every model call is traced and analyzed for cost, latency, and reliability.

## ✅ MVP status (Day 1 → Day 7)

- JSONL trace collector (`.prompttrace/traces.jsonl`)
- SDK wrapper: `withTrace(...)`
- Error taxonomy: `quota | permission | network | timeout | parse | unknown`
- Retry helper: `withRetry(...)` with backoff metadata
- Cost estimation + pricing source versioning
- Aggregator: totals, success rate, P50/P95, by endpoint/model/day
- Failures view: error breakdown + retry success rate
- Traces query with filters
- Local dashboard server (`/api/overview`, `/api/traces`, `/api/failures`)
- Exporters: JSON + Markdown report

## Install

```bash
npm install
npm run build
```

## CLI

```bash
# Overview metrics
node dist/index.js analyze --range 7d

# Raw traces (filterable)
node dist/index.js traces --range 7d --status error --limit 50

# Failures report
node dist/index.js failures --range 7d

# Export report
node dist/index.js export --format md --range 7d
node dist/index.js export --format json --range 7d

# Dashboard
node dist/index.js dashboard --port 4310
# then open http://localhost:4310
```

## Example integration

```ts
import { withTrace } from './sdk/trace.js';
import { withRetry } from './sdk/retry.js';

const { result, retries } = await withRetry(() => geminiCall(prompt), { maxRetries: 2, baseDelayMs: 400 });

await withTrace(
  {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    endpoint: 'narrative.generate',
    requestType: 'text',
    prompt,
    responsePreview: result.text,
    retries
  },
  async () => result
);
```

## Privacy defaults

- Default stores prompt preview (truncated) + hash, not full prompt
- Basic redaction masks email/phone/key-like patterns
- Full prompt logging requires `PROMPTTRACE_FULL=1`
- Logs stay local; delete `.prompttrace/` to clear data

## Output files

- `.prompttrace/traces.jsonl`
- `.prompttrace/REPORT.json`
- `.prompttrace/REPORT.md`

## Dashboard pages mapping

- **Overview:** KPI cards + full aggregate JSON
- **Traces:** filter by model/endpoint/status/error_category
- **Failures:** error category counts + recent failure list + retry effectiveness
