import { mkdirSync, appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { TraceEvent } from '../types/trace.js';

export function appendTrace(event: TraceEvent, filePath = '.prompttrace/traces.jsonl') {
  mkdirSync(dirname(filePath), { recursive: true });
  appendFileSync(filePath, JSON.stringify(event) + '\n', 'utf8');
}

export function rotateTraceFile(filePath = '.prompttrace/traces.jsonl', keepLines = 5000) {
  if (!existsSync(filePath)) return { kept: 0, removed: 0 };
  const lines = readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  if (lines.length <= keepLines) return { kept: lines.length, removed: 0 };
  const keptLines = lines.slice(lines.length - keepLines);
  writeFileSync(filePath, keptLines.join('\n') + '\n', 'utf8');
  return { kept: keptLines.length, removed: lines.length - keptLines.length };
}
