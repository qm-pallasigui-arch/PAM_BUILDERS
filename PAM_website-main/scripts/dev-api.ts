// Local adapter for the same handler deployed to Vercel. Vite proxies /api/portal here.
import { createServer } from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../api/portal/index.js';

createServer(async (request,response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const req = request as VercelRequest;
  req.query = Object.fromEntries(url.searchParams);
  const res = response as VercelResponse;
  res.status = code => { response.statusCode=code; return res; };
  res.json = data => { response.setHeader('Content-Type','application/json'); response.end(JSON.stringify(data)); return res; };
  res.send = data => { response.end(data); return res; };
  try {
    const chunks: Buffer[] = []; let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 4500000) { res.status(413).json({error:'Payload too large.'}); return; }
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString('utf8');
    req.body = body ? JSON.parse(body) : {};
    await handler(req,res);
  } catch { res.status(400).json({error:'Invalid request body.'}); }
}).listen(3001,'127.0.0.1',() => console.log('Portal API listening on http://127.0.0.1:3001'));
