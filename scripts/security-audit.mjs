import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const migrationFolder = 'supabase/migrations';
const migrationFiles = (await readdir(migrationFolder))
  .filter((name) => name.endsWith('.sql'))
  .sort();
const migrations = await Promise.all(
  migrationFiles.map(async (name) => ({
    name,
    sql: await readFile(join(migrationFolder, name), 'utf8'),
  })),
);
const combined = migrations.map((item) => item.sql).join('\n');
const failures = [];

for (const { name, sql } of migrations) {
  const functions = sql.matchAll(/create\s+or\s+replace\s+function[\s\S]*?\$\$;/gi);
  for (const match of functions) {
    const definition = match[0];
    if (/security\s+definer/i.test(definition) && !/set\s+search_path\s*=\s*''/i.test(definition)) {
      failures.push(`${name}: SECURITY DEFINER function without empty search_path`);
    }
  }
}

if (/grant\s+all\s+on\s+(?:table\s+)?public\.(?:profiles|profile_preferences|watch_sessions|notifications|notification_email_queue|app_events)\s+to\s+(?:anon|authenticated)/i.test(combined)) {
  failures.push('Broad GRANT ALL found on a sensitive table');
}
if (!/alter\s+table\s+public\.notification_email_queue\s+enable\s+row\s+level\s+security/i.test(combined)) {
  failures.push('Email queue does not enable RLS');
}
if (!/revoke\s+update\s+\(is_public,\s*featured_badge_id\)/i.test(combined)) {
  failures.push('Sensitive profile columns remain directly writable');
}
if (!/alter\s+table\s+public\.app_events\s+enable\s+row\s+level\s+security/i.test(combined)) {
  failures.push('App events do not enable RLS');
}
if (!/revoke\s+insert,\s*update,\s*delete\s+on\s+public\.app_events\s+from\s+authenticated/i.test(combined)) {
  failures.push('App events remain directly writable');
}
if (failures.length) {
  failures.forEach((failure) => process.stderr.write(`SECURITY FAIL: ${failure}\n`));
  process.exitCode = 1;
} else {
  process.stdout.write(`Security baseline OK: ${migrationFiles.length} migrations checked\n`);
}
