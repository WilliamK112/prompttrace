#!/usr/bin/env node
import { analyzeTraceFile } from './aggregator/analyze.js';
import { parseRangeDays } from './aggregator/load.js';
import { listTraces, failureSummary } from './aggregator/traces.js';
import { exportJson, exportMarkdown } from './cli/export.js';
import { startDashboard } from './cli/dashboard.js';
import { runAndTraceOpenClaw } from './cli/openclaw.js';

const args = process.argv.slice(2);
const cmd = args[0] || 'analyze';

function getArg(name: string, fallback?: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return fallback;
}

if (cmd === 'analyze') {
  const range = parseRangeDays(getArg('--range', '7d'));
  const result = analyzeTraceFile('.prompttrace/traces.jsonl', range);
  console.log(JSON.stringify(result, null, 2));
} else if (cmd === 'traces') {
  const range = parseRangeDays(getArg('--range', '7d'));
  const result = listTraces('.prompttrace/traces.jsonl', range, {
    model: getArg('--model'),
    endpoint: getArg('--endpoint'),
    status: getArg('--status') as any,
    error_category: getArg('--error')
  }, Number(getArg('--limit', '50')));
  console.log(JSON.stringify(result, null, 2));
} else if (cmd === 'failures') {
  const range = parseRangeDays(getArg('--range', '7d'));
  const result = failureSummary('.prompttrace/traces.jsonl', range);
  console.log(JSON.stringify(result, null, 2));
} else if (cmd === 'export') {
  const format = getArg('--format', 'md');
  const range = parseRangeDays(getArg('--range', '7d'));
  if (format === 'json') {
    const p = exportJson('.prompttrace/REPORT.json', range);
    console.log(`Exported ${p}`);
  } else {
    const p = exportMarkdown('.prompttrace/REPORT.md', range);
    console.log(`Exported ${p}`);
  }
} else if (cmd === 'dashboard') {
  startDashboard(Number(getArg('--port', '4310')));
} else if (cmd === 'openclaw') {
  const sep = args.indexOf('--');
  const command = sep >= 0 ? args.slice(sep + 1) : [];
  const endpoint = getArg('--endpoint', 'openclaw.tool.exec')!;
  runAndTraceOpenClaw(command, endpoint).catch((e) => {
    console.error(String((e as any)?.message || e));
    process.exit(1);
  });
} else {
  console.log('Usage: prompttrace analyze|traces|failures|export|dashboard|openclaw [--format md|json] [--range 7d]');
}
