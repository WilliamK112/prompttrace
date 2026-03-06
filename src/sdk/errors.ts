import type { ErrorCategory } from '../types/trace.js';

export function categorizeError(err: unknown): ErrorCategory {
  const msg = String((err as any)?.message || err || '').toLowerCase();
  const code = String((err as any)?.code || '').toLowerCase();

  if (msg.includes('resource_exhausted') || msg.includes('quota') || code.includes('429')) return 'quota';
  if (msg.includes('permission_denied') || msg.includes('forbidden') || code.includes('403')) return 'permission';
  if (msg.includes('etimedout') || msg.includes('timeout') || code.includes('timeout')) return 'timeout';
  if (msg.includes('fetch') || msg.includes('network') || code.includes('econn') || code.includes('enotfound')) return 'network';
  if (msg.includes('json') || msg.includes('parse') || msg.includes('schema')) return 'parse';

  return 'unknown';
}
