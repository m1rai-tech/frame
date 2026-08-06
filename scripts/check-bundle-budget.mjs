import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const distDirectory = join(process.cwd(), 'dist');
const manifest = JSON.parse(readFileSync(join(distDirectory, '.vite', 'manifest.json'), 'utf8'));
const entry = Object.values(manifest).find((item) => item.isEntry);
if (!entry) throw new Error('Vite entry was not found in the build manifest.');

const visited = new Set();
const visit = (item) => {
  if (!item || visited.has(item.file)) return;
  visited.add(item.file);
  for (const dependency of item.imports ?? []) visit(manifest[dependency]);
};
visit(entry);

const gzipBytes = [...visited].reduce(
  (total, file) => total + gzipSync(readFileSync(join(distDirectory, file))).byteLength,
  0,
);
const budgetBytes = 200 * 1024;
const sizeKb = (gzipBytes / 1024).toFixed(1);
if (gzipBytes > budgetBytes) {
  throw new Error(`Initial JavaScript is ${sizeKb} KB gzip; budget is 200 KB.`);
}
console.log(`Initial JavaScript: ${sizeKb} KB gzip of 200 KB budget.`);
