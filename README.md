# PromptTrace

PromptTrace gives LLM apps a black-box recorder: every model call is traced and can be analyzed for cost, latency, and reliability.

## MVP (Day 1/2 delivered)

- JSONL trace collector (`.prompttrace/traces.jsonl`)
- SDK wrapper: `withTrace(...)`
- Error categorization: `quota | permission | network | timeout | parse | unknown`
- Retry helper: `withRetry(...)`
- Cost estimation + pricing source version
- CLI analyze/export:
  - `prompttrace analyze --range 7d`
  - `prompttrace export --format md --range 7d`

## Quick start

```bash
npm install
npm run build
node dist/index.js analyze --range 7d
node dist/index.js export --format md --range 7d
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

- By default only prompt preview (truncated) + hash are stored
- Basic redaction masks email/phone/key-like patterns
- Full prompt logging requires `PROMPTTRACE_FULL=1`

## Output files

- `.prompttrace/traces.jsonl`
- `.prompttrace/REPORT.json`
- `.prompttrace/REPORT.md`
