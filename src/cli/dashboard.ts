import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analyzeTraceFile } from '../aggregator/analyze.js';
import { failureSummary, listTraces } from '../aggregator/traces.js';
import { parseRangeDays } from '../aggregator/load.js';
import { appendTrace } from '../collector/jsonl.js';

function writeCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res: any, obj: unknown) {
  writeCors(res);
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export function startDashboard(port = 4310) {
  const htmlPath = resolve(process.cwd(), 'src/dashboard/index.html');

  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`);

    if (req.method === 'OPTIONS') {
      writeCors(res);
      res.writeHead(204);
      return res.end();
    }

    if (url.pathname === '/api/ingest' && req.method === 'POST') {
      try {
        const raw = await readBody(req);
        const event = JSON.parse(raw);
        appendTrace(event, '.prompttrace/traces.jsonl');
        return sendJson(res, { ok: true });
      } catch (e) {
        writeCors(res);
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ ok: false, error: String((e as any)?.message || e) }));
      }
    }

    if (url.pathname === '/api/overview') {
      const rangeDays = parseRangeDays(url.searchParams.get('range') || '7d');
      return sendJson(res, analyzeTraceFile('.prompttrace/traces.jsonl', rangeDays));
    }

    if (url.pathname === '/api/traces') {
      const rangeDays = parseRangeDays(url.searchParams.get('range') || '7d');
      const limit = Number(url.searchParams.get('limit') || 200);
      return sendJson(
        res,
        listTraces(
          '.prompttrace/traces.jsonl',
          rangeDays,
          {
            model: url.searchParams.get('model') || undefined,
            endpoint: url.searchParams.get('endpoint') || undefined,
            status: (url.searchParams.get('status') as any) || undefined,
            error_category: url.searchParams.get('error_category') || undefined,
            cache_hit: (url.searchParams.get('cache_hit') as any) || undefined
          },
          limit
        )
      );
    }

    if (url.pathname === '/api/failures') {
      const rangeDays = parseRangeDays(url.searchParams.get('range') || '7d');
      return sendJson(res, failureSummary('.prompttrace/traces.jsonl', rangeDays));
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = readFileSync(htmlPath, 'utf8');
      writeCors(res);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    writeCors(res);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });

  server.listen(port, () => {
    console.log(`PromptTrace dashboard: http://localhost:${port}`);
    console.log(`PromptTrace ingest endpoint: http://localhost:${port}/api/ingest`);
  });
}
