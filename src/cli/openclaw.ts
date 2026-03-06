import { spawn } from 'node:child_process';
import { appendTrace } from '../collector/jsonl.js';

export async function runAndTraceOpenClaw(cmd: string[], endpoint = 'openclaw.tool.exec') {
  if (!cmd.length) throw new Error('Missing command. Usage: prompttrace openclaw -- <command...>');

  const t0 = Date.now();
  const span = `${t0}-${Math.random().toString(36).slice(2, 10)}`;

  const child = spawn(cmd[0], cmd.slice(1), { stdio: 'inherit' });

  const code: number = await new Promise((resolve) => {
    child.on('close', (c) => resolve(c ?? 1));
    child.on('error', () => resolve(1));
  });

  const t1 = Date.now();
  appendTrace({
    span_id: span,
    timestamp_start: new Date(t0).toISOString(),
    timestamp_end: new Date(t1).toISOString(),
    latency_ms: t1 - t0,
    provider: 'local',
    model: 'openclaw',
    endpoint,
    request_type: 'tool_call',
    prompt_preview: cmd.join(' '),
    input_tokens: null,
    output_tokens: null,
    total_tokens: null,
    status: code === 0 ? 'ok' : 'error',
    error_category: code === 0 ? null : 'unknown',
    retries: { count: 0, finalOutcome: code === 0 ? 'success' : 'failed' },
    cache: { hit: false },
    estimated_cost_usd: 0,
    pricing_source: 'prompttrace-openclaw-v1',
    redaction_applied: false
  });

  if (code !== 0) {
    throw new Error(`Command failed with exit code ${code}`);
  }
}
