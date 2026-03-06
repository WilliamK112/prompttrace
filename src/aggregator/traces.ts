import type { TraceEvent } from '../types/trace.js';
import { loadTraceEvents } from './load.js';

export interface TraceFilters {
  model?: string;
  endpoint?: string;
  status?: 'ok' | 'error';
  error_category?: string;
  cache_hit?: 'true' | 'false';
}

export function listTraces(filePath = '.prompttrace/traces.jsonl', rangeDays = 7, filters: TraceFilters = {}, limit = 200): TraceEvent[] {
  let events = loadTraceEvents(filePath, rangeDays);

  if (filters.model) events = events.filter((e) => e.model === filters.model);
  if (filters.endpoint) events = events.filter((e) => e.endpoint === filters.endpoint);
  if (filters.status) events = events.filter((e) => e.status === filters.status);
  if (filters.error_category) events = events.filter((e) => (e.error_category || '') === filters.error_category);
  if (filters.cache_hit) {
    const want = filters.cache_hit === 'true';
    events = events.filter((e) => Boolean(e.cache?.hit) === want);
  }

  return events
    .sort((a, b) => b.timestamp_start.localeCompare(a.timestamp_start))
    .slice(0, limit);
}

export function failureSummary(filePath = '.prompttrace/traces.jsonl', rangeDays = 7) {
  const events = loadTraceEvents(filePath, rangeDays);
  const failures = events.filter((e) => e.status === 'error');

  const byErrorCategory: Record<string, number> = {};
  for (const f of failures) {
    const k = f.error_category || 'unknown';
    byErrorCategory[k] = (byErrorCategory[k] || 0) + 1;
  }

  const retried = events.filter((e) => (e.retries?.count || 0) > 0);
  const retrySuccessRate = retried.length ? retried.filter((e) => e.status === 'ok').length / retried.length : 0;

  return {
    totalFailures: failures.length,
    byErrorCategory,
    retrySuccessRate,
    recentFailures: failures
      .sort((a, b) => b.timestamp_start.localeCompare(a.timestamp_start))
      .slice(0, 50)
  };
}
