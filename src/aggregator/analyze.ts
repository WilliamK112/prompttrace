import type { TraceEvent } from '../types/trace.js';
import { loadTraceEvents, percentile } from './load.js';

export interface AggregateResult {
  totalCalls: number;
  successRate: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  totalEstimatedCostUsd: number;
  totalTokens: number;
  byEndpoint: Record<string, { calls: number; failRate: number; p95LatencyMs: number; costUsd: number }>;
  byModel: Record<string, { calls: number; failRate: number; p95LatencyMs: number; costUsd: number }>;
  byErrorCategory: Record<string, number>;
  byDay: Array<{ day: string; calls: number; costUsd: number; p95LatencyMs: number }>;
  retrySuccessRate: number;
}

function summarizeGroup(events: TraceEvent[]) {
  const fails = events.filter((x) => x.status === 'error').length;
  return {
    calls: events.length,
    failRate: events.length ? fails / events.length : 0,
    p95LatencyMs: percentile(events.map((x) => x.latency_ms), 95),
    costUsd: events.reduce((s, x) => s + (x.estimated_cost_usd || 0), 0)
  };
}

export function analyzeTraceFile(filePath = '.prompttrace/traces.jsonl', rangeDays = 7): AggregateResult {
  const events = loadTraceEvents(filePath, rangeDays);
  const latencies = events.map((e) => e.latency_ms);
  const ok = events.filter((e) => e.status === 'ok').length;

  const byEndpointRaw = new Map<string, TraceEvent[]>();
  const byModelRaw = new Map<string, TraceEvent[]>();
  const byDayRaw = new Map<string, TraceEvent[]>();
  const byErrorCategory: Record<string, number> = {};

  let retried = 0;
  let retriedSuccess = 0;

  for (const e of events) {
    (byEndpointRaw.get(e.endpoint) || byEndpointRaw.set(e.endpoint, []).get(e.endpoint)!).push(e);
    (byModelRaw.get(e.model) || byModelRaw.set(e.model, []).get(e.model)!).push(e);

    const day = e.timestamp_start.slice(0, 10);
    (byDayRaw.get(day) || byDayRaw.set(day, []).get(day)!).push(e);

    if (e.error_category) byErrorCategory[e.error_category] = (byErrorCategory[e.error_category] || 0) + 1;

    if ((e.retries?.count || 0) > 0) {
      retried += 1;
      if (e.status === 'ok') retriedSuccess += 1;
    }
  }

  const byEndpoint: AggregateResult['byEndpoint'] = {};
  for (const [k, arr] of byEndpointRaw.entries()) byEndpoint[k] = summarizeGroup(arr);

  const byModel: AggregateResult['byModel'] = {};
  for (const [k, arr] of byModelRaw.entries()) byModel[k] = summarizeGroup(arr);

  const byDay = [...byDayRaw.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, arr]) => ({
      day,
      calls: arr.length,
      costUsd: arr.reduce((s, x) => s + (x.estimated_cost_usd || 0), 0),
      p95LatencyMs: percentile(arr.map((x) => x.latency_ms), 95)
    }));

  return {
    totalCalls: events.length,
    successRate: events.length ? ok / events.length : 0,
    p50LatencyMs: percentile(latencies, 50),
    p95LatencyMs: percentile(latencies, 95),
    totalEstimatedCostUsd: events.reduce((s, e) => s + (e.estimated_cost_usd || 0), 0),
    totalTokens: events.reduce((s, e) => s + (e.total_tokens || 0), 0),
    byEndpoint,
    byModel,
    byErrorCategory,
    byDay,
    retrySuccessRate: retried ? retriedSuccess / retried : 0
  };
}
