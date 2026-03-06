import { loadTraceEvents } from './load.js';

export function openclawSummary(filePath = '.prompttrace/traces.jsonl', rangeDays = 7) {
  const events = loadTraceEvents(filePath, rangeDays).filter((e) => (e.endpoint || '').startsWith('openclaw.'));
  const ok = events.filter((e) => e.status === 'ok').length;

  const byEndpoint: Record<string, number> = {};
  for (const e of events) byEndpoint[e.endpoint] = (byEndpoint[e.endpoint] || 0) + 1;

  return {
    totalOpenClawEvents: events.length,
    successRate: events.length ? ok / events.length : 0,
    byEndpoint,
    recent: events.sort((a, b) => b.timestamp_start.localeCompare(a.timestamp_start)).slice(0, 30)
  };
}
