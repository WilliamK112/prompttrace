import { existsSync, readFileSync } from 'node:fs';
import type { TraceEvent } from '../types/trace.js';

export function parseRangeDays(range?: string): number {
  if (!range) return 7;
  const m = range.match(/^(\d+)d$/);
  if (m) return Number(m[1]);
  return 7;
}

export function inRange(iso: string, rangeDays: number): boolean {
  const t = new Date(iso).getTime();
  const now = Date.now();
  return t >= now - rangeDays * 24 * 60 * 60 * 1000;
}

export function loadTraceEvents(filePath = '.prompttrace/traces.jsonl', rangeDays = 7): TraceEvent[] {
  if (!existsSync(filePath)) return [];
  const lines = readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  return lines
    .map((l) => {
      try {
        return JSON.parse(l) as TraceEvent;
      } catch {
        return null;
      }
    })
    .filter((x): x is TraceEvent => Boolean(x))
    .filter((e) => inRange(e.timestamp_start, rangeDays));
}

export function percentile(nums: number[], p: number): number {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}
