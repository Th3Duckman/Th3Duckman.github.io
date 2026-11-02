import { mkdir, cp, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['index.html', 'styles.css', 'app.js', 'logic.js', '.nojekyll', 'assets'];
for (const name of files) await stat(resolve(root, name));
await rm(resolve(root, 'dist'), { recursive: true, force: true });
await mkdir(resolve(root, 'dist'), { recursive: true });
for (const name of files) await cp(resolve(root, name), resolve(root, 'dist', name), { recursive: true });
console.log('Static production site built in dist/. No runtime dependencies.');
