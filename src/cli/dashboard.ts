import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analyzeTraceFile } from '../aggregator/analyze.js';
import { failureSummary, listTraces } from '../aggregator/traces.js';
import { parseRangeDays } from '../aggregator/load.js';

function sendJson(res: any, obj: unknown) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

export function startDashboard(port = 4310) {
  const htmlPath = resolve(process.cwd(), 'src/dashboard/index.html');
  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`);

    if (url.pathname === '/api/overview') {
      const rangeDays = parseRangeDays(url.searchParams.get('range') || '7d');
      return sendJson(res, analyzeTraceFile('.prompttrace/traces.jsonl', rangeDays));
    }

    if (url.pathname === '/api/traces') {
      const rangeDays = parseRangeDays(url.searchParams.get('range') || '7d');
      const limit = Number(url.searchParams.get('limit') || 200);
      return sendJson(
        res,
        listTraces('.prompttrace/traces.jsonl', rangeDays, {
          model: url.searchParams.get('model') || undefined,
          endpoint: url.searchParams.get('endpoint') || undefined,
          status: (url.searchParams.get('status') as any) || undefined,
          error_category: url.searchParams.get('error_category') || undefined,
          cache_hit: (url.searchParams.get('cache_hit') as any) || undefined
        }, limit)
      );
    }

    if (url.pathname === '/api/failures') {
      const rangeDays = parseRangeDays(url.searchParams.get('range') || '7d');
      return sendJson(res, failureSummary('.prompttrace/traces.jsonl', rangeDays));
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = readFileSync(htmlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });

  server.listen(port, () => {
    console.log(`PromptTrace dashboard: http://localhost:${port}`);
  });
}
