const PRICE_TABLE: Record<string, { inputPer1k: number; outputPer1k: number }> = {
  'gemini-1.5-flash': { inputPer1k: 0.00035, outputPer1k: 0.00105 },
  'gemini-1.5-pro': { inputPer1k: 0.0035, outputPer1k: 0.0105 },
  'gpt-4o-mini': { inputPer1k: 0.00015, outputPer1k: 0.0006 }
};

export const PRICING_SOURCE = 'prompttrace-price-table-v0.1';

export function estimateCostUsd(model: string, inputTokens: number | null, outputTokens: number | null): number | null {
  const m = model.toLowerCase();
  const row = Object.entries(PRICE_TABLE).find(([k]) => m.includes(k))?.[1];
  if (!row) return null;
  const inTok = inputTokens ?? 0;
  const outTok = outputTokens ?? 0;
  return (inTok / 1000) * row.inputPer1k + (outTok / 1000) * row.outputPer1k;
}
