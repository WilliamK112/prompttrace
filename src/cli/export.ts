import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { analyzeTraceFile } from '../aggregator/analyze.js';

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function exportJson(outPath = '.prompttrace/REPORT.json', rangeDays = 7) {
  const data = analyzeTraceFile('.prompttrace/traces.jsonl', rangeDays);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
  return outPath;
}

export function exportMarkdown(outPath = '.prompttrace/REPORT.md', rangeDays = 7) {
  const data = analyzeTraceFile('.prompttrace/traces.jsonl', rangeDays);
  const topCost = Object.entries(data.byEndpoint)
    .sort((a, b) => b[1].costUsd - a[1].costUsd)
    .slice(0, 5);

  const topSlow = Object.entries(data.byEndpoint)
    .sort((a, b) => b[1].p95LatencyMs - a[1].p95LatencyMs)
    .slice(0, 5);

  const md = `# PromptTrace Report (${rangeDays}d)\n\n## 1. Summary\n- Total calls: ${data.totalCalls}\n- Success rate: ${formatPct(data.successRate)}\n- Total tokens: ${data.totalTokens}\n- Estimated cost (USD): $${data.totalEstimatedCostUsd.toFixed(4)}\n- Latency P50/P95: ${data.p50LatencyMs}ms / ${data.p95LatencyMs}ms\n\n## 2. Costs\n${topCost.map(([k, v]) => `- ${k}: $${v.costUsd.toFixed(4)} (${v.calls} calls)`).join('\n') || '- no data'}\n\n## 3. Latency\n${topSlow.map(([k, v]) => `- ${k}: P95 ${v.p95LatencyMs}ms`).join('\n') || '- no data'}\n\n## 4. Reliability\n${Object.entries(data.byErrorCategory).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- no errors'}\n\n## 5. Action Plan\n### Quick Wins\n- Add cache for top-cost endpoints\n- Add timeout-aware retry for transient network/timeout failures\n\n### Next\n- Split model by workload (cheap model for simple text paths)\n- Add endpoint-specific SLO thresholds\n\n### Hard\n- Add queue/async workflow for long-running image/video generation\n\n## 6. Evidence\n- Source: .prompttrace/traces.jsonl\n`;

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, md, 'utf8');
  return outPath;
}
