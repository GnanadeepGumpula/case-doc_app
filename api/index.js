import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import server from '../dist/server/server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, '../dist/client');

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.txt': 'text/plain; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
  };
  return map[ext] || 'application/octet-stream';
}

async function tryServeStatic(pathname) {
  if (!pathname || pathname === '/') return null;
  const safePath = pathname.split('?')[0].split('#')[0];
  const relativePath = safePath.replace(/^\/+/, '');
  if (!relativePath || relativePath.startsWith('api/')) return null;

  const fullPath = path.resolve(clientRoot, relativePath);
  if (!fullPath.startsWith(clientRoot)) return null;

  try {
    const stat = await fs.promises.stat(fullPath);
    if (!stat.isFile()) return null;

    const fileBuffer = await fs.promises.readFile(fullPath);
    return {
      statusCode: 200,
      headers: {
        'content-type': getContentType(fullPath),
        'cache-control': 'public, max-age=31536000, immutable',
      },
      body: fileBuffer,
    };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const host = req.headers.host || 'localhost';
  const origin = `https://${host}`;
  const originalUrlHeader = req.headers['x-vercel-original-url'] || req.headers['x-forwarded-uri'] || req.url || '/';
  const url = new URL(originalUrlHeader, origin);

  const staticAsset = await tryServeStatic(url.pathname);
  if (staticAsset) {
    res.statusCode = staticAsset.statusCode;
    Object.entries(staticAsset.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.end(staticAsset.body);
    return;
  }

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    const headerValue = Array.isArray(value) ? value.join(', ') : value;
    headers.set(key, headerValue);
  }

  const requestInit = {
    method: req.method || 'GET',
    headers,
  };

  if (req.method && !['GET', 'HEAD'].includes(req.method)) {
    const body = req.body;
    if (body != null) {
      requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
  }

  const request = new Request(url, requestInit);
  const response = await server.fetch(request, {}, {});
  const body = Buffer.from(await response.arrayBuffer());

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'content-length') return;
    res.setHeader(key, value);
  });

  if (!response.headers.has('content-length')) {
    res.setHeader('content-length', body.byteLength);
  }

  res.end(body);
}

export const config = {
  runtime: 'nodejs',
};
