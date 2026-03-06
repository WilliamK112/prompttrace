const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /\+?\d[\d\s().-]{7,}\d/g;
const API_KEY = /(api[_-]?key|token|secret)\s*[:=]\s*['\"]?([A-Za-z0-9._-]{8,})['\"]?/gi;

export function redactBasic(text: string): { text: string; redacted: boolean } {
  let redacted = false;
  let out = text;
  const before = out;
  out = out.replace(EMAIL, '***@***.***');
  out = out.replace(PHONE, '***PHONE***');
  out = out.replace(API_KEY, '$1=***');
  redacted = before !== out;
  return { text: out, redacted };
}

export function preview(text: string, maxLen = 500): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + ` ...[truncated ${text.length - maxLen} chars]`;
}
