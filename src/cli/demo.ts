import { withTrace } from '../sdk/trace.js';
import { withRetry } from '../sdk/retry.js';

async function fakeGeminiCall(prompt: string): Promise<{ text: string }> {
  if (prompt.includes('fail-once') && Math.random() < 0.8) {
    const err: any = new Error('RESOURCE_EXHAUSTED: quota exceeded');
    err.code = 429;
    throw err;
  }
  await new Promise((r) => setTimeout(r, 120));
  return { text: 'Generated narrative scene...' };
}

async function run() {
  const prompt = 'Create next D&D scene for party at haunted gate fail-once';
  try {
    const { result, retries } = await withRetry(() => fakeGeminiCall(prompt), { maxRetries: 2, baseDelayMs: 100 });
    await withTrace(
      {
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        endpoint: 'narrative.generate',
        requestType: 'text',
        prompt,
        responsePreview: result.text,
        retries,
        inputTokens: 220,
        outputTokens: 85
      },
      async () => result
    );
    console.log('Demo trace written');
  } catch (err) {
    await withTrace(
      {
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        endpoint: 'narrative.generate',
        requestType: 'text',
        prompt,
        retries: { count: 2, delaysMs: [100, 200] }
      },
      async () => {
        throw err;
      }
    );
  }
}

run();
