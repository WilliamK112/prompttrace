#!/usr/bin/env node
import { analyzeTraceFile } from './aggregator/analyze.js';
import { exportJson, exportMarkdown } from './cli/export.js';

const args = process.argv.slice(2);
const cmd = args[0] || 'analyze';

function getArg(name: string, fallback?: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return fallback;
}

function parseRange(range?: string): number {
  if (!range) return 7;
  const m = range.match(/^(\d+)d$/);
  if (m) return Number(m[1]);
  return 7;
}

if (cmd === 'analyze') {
  const range = parseRange(getArg('--range', '7d'));
  const result = analyzeTraceFile('.prompttrace/traces.jsonl', range);
  console.log(JSON.stringify(result, null, 2));
} else if (cmd === 'export') {
  const format = getArg('--format', 'md');
  const range = parseRange(getArg('--range', '7d'));
  if (format === 'json') {
    const p = exportJson('.prompttrace/REPORT.json', range);
    console.log(`Exported ${p}`);
  } else {
    const p = exportMarkdown('.prompttrace/REPORT.md', range);
    console.log(`Exported ${p}`);
  }
} else {
  console.log('Usage: prompttrace analyze|export [--format md|json] [--range 7d]');
}
