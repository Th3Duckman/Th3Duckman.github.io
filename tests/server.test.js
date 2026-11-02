import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../scripts/serve.mjs';

let server, base;
before(async () => {
  server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => { if (server?.listening) server.close(resolve); else resolve(); }));

test('serves the portfolio and its local assets with correct MIME types', async () => {
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /BACKEND DEVELOPMENT · C# \/ .NET &amp; JAVA|BACKEND DEVELOPMENT · C# \/ .NET & JAVA/);
  for (const [path, type] of [['/app.js', 'text/javascript'], ['/styles.css', 'text/css'], ['/assets/favicon.svg', 'image/svg+xml'], ['/assets/Achilleas_Botsidis_CV.pdf', 'application/pdf']]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    assert.ok(response.headers.get('content-type').startsWith(type), path);
  }
});

test('does not expose repository metadata, development scripts, or arbitrary paths', async () => {
  for (const path of ['/.git/config', '/package.json', '/scripts/serve.mjs', '/assets/%2e%2e%2fpackage.json', '/assets/..%5cpackage.json', '/missing']) {
    assert.equal((await fetch(base + path)).status, 404, path);
  }
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  assert.equal((await fetch(base + '/%zz')).status, 400);
  assert.equal((await fetch(base, { method: 'HEAD' })).status, 200);
});
