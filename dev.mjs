#!/usr/bin/env node
// Local preview server (no dependencies): `node dev.mjs` → http://localhost:8000
// - serves the site
// - /projects/index.json and /writeups/index.json list Markdown files automatically
// - reloads the open page whenever a file in the project is saved
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { watch } from 'node:fs';
import { extname, join, normalize, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT) || 8000;
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
};
const clients = new Set();

async function listMarkdown(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(entries.map((e) =>
    e.isDirectory() ? listMarkdown(join(dir, e.name)) : e.name.endsWith('.md') ? [join(dir, e.name)] : []));
  return nested.flat();
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (path === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
    res.write(':\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  if (path === '/writeups/index.json' || path === '/projects/index.json') {
    const dir = join(root, path.split('/')[1]);
    const files = (await listMarkdown(dir)).map((f) => relative(dir, f).split(sep).join('/'));
    res.writeHead(200, { 'Content-Type': types['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ dev: true, files }));
    return;
  }
  const file = normalize(join(root, path.endsWith('/') ? path + 'index.html' : path));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Preview: http://localhost:${port}/`));

let timer;
watch(root, { recursive: true }, (_, name) => {
  if (!name || name.startsWith('.git')) return;
  clearTimeout(timer);
  timer = setTimeout(() => clients.forEach((c) => c.write('data: reload\n\n')), 100);
});
