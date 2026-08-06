import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'pgsql-parser';

const folders = ['supabase/migrations', 'supabase/sql-editor'];
const files = [];
for (const folder of folders) {
  for (const name of await readdir(folder)) {
    if (name.endsWith('.sql')) files.push(join(folder, name));
  }
}
files.push('supabase/seed.sql');

for (const file of files) {
  await parse(await readFile(file, 'utf8'));
  process.stdout.write(`SQL OK: ${file}\n`);
}
