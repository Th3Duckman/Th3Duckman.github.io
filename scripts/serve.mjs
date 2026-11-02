import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8' };
const entryFiles = new Set(['index.html', 'styles.css', 'app.js', 'logic.js']);

export function createServer(root = projectRoot) {
  return http.createServer(async (request, response) => {
    const headers = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { ...headers, Allow: 'GET, HEAD' }).end('Method not allowed'); return;
    }
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
      const segments = relative.split('/');
      if (segments.some(segment => segment.startsWith('.') || segment.includes('\\')) || (!entryFiles.has(relative) && !relative.startsWith('assets/'))) {
        response.writeHead(404, headers).end('Not found'); return;
      }
      const path = resolve(root, relative);
      if (!path.startsWith(resolve(root) + '/') || !(await stat(path)).isFile()) {
        response.writeHead(404, headers).end('Not found'); return;
      }
      const content = await readFile(path);
      response.writeHead(200, { ...headers, 'Content-Type': mimeTypes[extname(path)] || 'application/octet-stream', 'Content-Length': content.length, 'Cache-Control': 'no-cache' });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      response.writeHead(error instanceof URIError ? 400 : 404, headers).end(error instanceof URIError ? 'Bad request' : 'Not found');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argument = flag => { const index = process.argv.indexOf(flag); return index < 0 ? undefined : process.argv[index + 1]; };
  const port = Number(argument('--port') || process.env.PORT || 3000);
  const host = argument('--host') || process.env.HOST || '0.0.0.0';
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535');
  const server = createServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, host, () => console.log(`Portfolio development server listening on port ${port}`));
}
