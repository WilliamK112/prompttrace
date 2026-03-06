import { readFileSync, existsSync } from 'node:fs';
import type { TraceEvent } from '../types/trace.js';

export interface AggregateResult {
  totalCalls: number;
  successRate: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  totalEstimatedCostUsd: number;
  totalTokens: number;
  byEndpoint: Record<string, { calls: number; failRate: number; p95LatencyMs: number; costUsd: number }>;
  byErrorCategory: Record<string, number>;
}

function percentile(nums: number[], p: number): number {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function inRange(iso: string, rangeDays: number): boolean {
  const t = new Date(iso).getTime();
  const now = Date.now();
  return t >= now - rangeDays * 24 * 60 * 60 * 1000;
}

export function analyzeTraceFile(filePath = '.prompttrace/traces.jsonl', rangeDays = 7): AggregateResult {
  if (!existsSync(filePath)) {
    return {
      totalCalls: 0,
      successRate: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      totalEstimatedCostUsd: 0,
      totalTokens: 0,
      byEndpoint: {},
      byErrorCategory: {}
    };
  }

  const lines = readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  const events = lines.map((l) => JSON.parse(l) as TraceEvent).filter((e) => inRange(e.timestamp_start, rangeDays));

  const latencies = events.map((e) => e.latency_ms);
  const ok = events.filter((e) => e.status === 'ok').length;

  const byEndpointRaw = new Map<string, TraceEvent[]>();
  const byErrorCategory: Record<string, number> = {};

  for (const e of events) {
    const arr = byEndpointRaw.get(e.endpoint) || [];
    arr.push(e);
    byEndpointRaw.set(e.endpoint, arr);
    if (e.error_category) byErrorCategory[e.error_category] = (byErrorCategory[e.error_category] || 0) + 1;
  }

  const byEndpoint: AggregateResult['byEndpoint'] = {};
  for (const [endpoint, arr] of byEndpointRaw.entries()) {
    const fails = arr.filter((x) => x.status === 'error').length;
    byEndpoint[endpoint] = {
      calls: arr.length,
      failRate: arr.length ? fails / arr.length : 0,
      p95LatencyMs: percentile(arr.map((x) => x.latency_ms), 95),
      costUsd: arr.reduce((s, x) => s + (x.estimated_cost_usd || 0), 0)
    };
  }

  return {
    totalCalls: events.length,
    successRate: events.length ? ok / events.length : 0,
    p50LatencyMs: percentile(latencies, 50),
    p95LatencyMs: percentile(latencies, 95),
    totalEstimatedCostUsd: events.reduce((s, e) => s + (e.estimated_cost_usd || 0), 0),
    totalTokens: events.reduce((s, e) => s + (e.total_tokens || 0), 0),
    byEndpoint,
    byErrorCategory
  };
}
