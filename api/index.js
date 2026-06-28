import server from '../dist/server/server.js';

function toNodeHeaders(headers) {
  const entries = [];
  headers.forEach((value, key) => {
    entries.push([key, value]);
  });
  return Object.fromEntries(entries);
}

export default async function handler(req, res) {
  const origin = req.headers.host ? `https://${req.headers.host}` : 'https://localhost';
  const url = new URL(req.url || '/', origin);

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
  runtime: 'nodejs22.x',
};
