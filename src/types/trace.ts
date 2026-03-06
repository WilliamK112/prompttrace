export type Provider = 'gemini' | 'openai' | 'local' | 'unknown';
export type RequestType = 'text' | 'image' | 'video' | 'tool_call' | 'unknown';
export type TraceStatus = 'ok' | 'error';
export type ErrorCategory = 'quota' | 'permission' | 'network' | 'timeout' | 'parse' | 'unknown' | null;

export interface RetryInfo {
  count: number;
  delaysMs?: number[];
  finalOutcome: 'success' | 'failed';
}

export interface CacheInfo {
  hit: boolean;
  key?: string;
}

export interface TraceEvent {
  trace_id?: string;
  span_id: string;
  timestamp_start: string;
  timestamp_end: string;
  latency_ms: number;

  provider: Provider;
  model: string;
  endpoint: string;
  request_type: RequestType;

  prompt_preview?: string;
  prompt_hash?: string;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  response_preview?: string;
  structured_output_ok?: boolean;

  status: TraceStatus;
  error_category: ErrorCategory;
  error_message_preview?: string;
  retries: RetryInfo;
  cache: CacheInfo;

  estimated_cost_usd: number | null;
  pricing_source: string;

  redaction_applied: boolean;
}

export interface TraceOptions {
  traceId?: string;
  provider?: Provider;
  model: string;
  endpoint: string;
  requestType?: RequestType;
  prompt?: string;
  responsePreview?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  structuredOutputOk?: boolean;
  cacheHit?: boolean;
  cacheKey?: string;
  retries?: { count: number; delaysMs?: number[] };
  pricingSource?: string;
}
