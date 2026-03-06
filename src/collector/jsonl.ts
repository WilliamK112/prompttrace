import { mkdirSync, appendFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { TraceEvent } from '../types/trace.js';

export function appendTrace(event: TraceEvent, filePath = '.prompttrace/traces.jsonl') {
  mkdirSync(dirname(filePath), { recursive: true });
  appendFileSync(filePath, JSON.stringify(event) + '\n', 'utf8');
}
