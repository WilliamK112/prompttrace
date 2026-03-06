import { createHash, randomUUID } from 'node:crypto';
import type { TraceEvent, TraceOptions } from '../types/trace.js';
import { appendTrace } from '../collector/jsonl.js';
import { redactBasic, preview } from './redact.js';
import { categorizeError } from './errors.js';
import { estimateCostUsd, PRICING_SOURCE } from './cost.js';

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export async function withTrace<T>(
  options: TraceOptions,
  fn: () => Promise<T>,
  sinkPath = '.prompttrace/traces.jsonl'
): Promise<T> {
  const spanId = randomUUID();
  const t0 = Date.now();
  const start = new Date(t0).toISOString();

  const full = process.env.PROMPTTRACE_FULL === '1';
  const promptRaw = options.prompt ?? '';
  const red = redactBasic(promptRaw);
  const promptStored = full ? red.text : preview(red.text, 500);

  try {
    const result = await fn();
    const t1 = Date.now();
    const latency = t1 - t0;

    const inputTokens = options.inputTokens ?? null;
    const outputTokens = options.outputTokens ?? null;
    const totalTokens = options.totalTokens ?? (inputTokens != null && outputTokens != null ? inputTokens + outputTokens : null);

    const event: TraceEvent = {
      trace_id: options.traceId,
      span_id: spanId,
      timestamp_start: start,
      timestamp_end: new Date(t1).toISOString(),
      latency_ms: latency,
      provider: options.provider ?? 'unknown',
      model: options.model,
      endpoint: options.endpoint,
      request_type: options.requestType ?? 'unknown',
      prompt_preview: promptStored || undefined,
      prompt_hash: promptRaw ? sha256(promptRaw) : undefined,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      response_preview: options.responsePreview ? preview(options.responsePreview, 500) : undefined,
      structured_output_ok: options.structuredOutputOk,
      status: 'ok',
      error_category: null,
      retries: {
        count: options.retries?.count ?? 0,
        delaysMs: options.retries?.delaysMs,
        finalOutcome: 'success'
      },
      cache: {
        hit: options.cacheHit ?? false,
        key: options.cacheKey
      },
      estimated_cost_usd: estimateCostUsd(options.model, inputTokens, outputTokens),
      pricing_source: options.pricingSource ?? PRICING_SOURCE,
      redaction_applied: red.redacted
    };

    appendTrace(event, sinkPath);
    return result;
  } catch (err) {
    const t1 = Date.now();
    const event: TraceEvent = {
      trace_id: options.traceId,
      span_id: spanId,
      timestamp_start: start,
      timestamp_end: new Date(t1).toISOString(),
      latency_ms: t1 - t0,
      provider: options.provider ?? 'unknown',
      model: options.model,
      endpoint: options.endpoint,
      request_type: options.requestType ?? 'unknown',
      prompt_preview: promptStored || undefined,
      prompt_hash: promptRaw ? sha256(promptRaw) : undefined,
      input_tokens: options.inputTokens ?? null,
      output_tokens: options.outputTokens ?? null,
      total_tokens: options.totalTokens ?? null,
      response_preview: undefined,
      structured_output_ok: options.structuredOutputOk,
      status: 'error',
      error_category: categorizeError(err),
      error_message_preview: preview(String((err as any)?.message || err || 'unknown error'), 300),
      retries: {
        count: options.retries?.count ?? 0,
        delaysMs: options.retries?.delaysMs,
        finalOutcome: 'failed'
      },
      cache: {
        hit: options.cacheHit ?? false,
        key: options.cacheKey
      },
      estimated_cost_usd: estimateCostUsd(options.model, options.inputTokens ?? null, options.outputTokens ?? null),
      pricing_source: options.pricingSource ?? PRICING_SOURCE,
      redaction_applied: red.redacted
    };
    appendTrace(event, sinkPath);
    throw err;
  }
}
