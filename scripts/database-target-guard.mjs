const sourceValue = process.env.SOURCE_DB_URL;
const targetValue = process.env.TARGET_DB_URL;
const confirmation = process.env.CONFIRM_TARGET;

if (!sourceValue || !targetValue) {
  throw new Error('SOURCE_DB_URL and TARGET_DB_URL are required.');
}
if (confirmation !== 'RESET_STAGING') {
  throw new Error('Set CONFIRM_TARGET=RESET_STAGING to confirm the staging reset.');
}

const parseDatabaseUrl = (value, label) => {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid database URL.`);
  }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error(`${label} must use postgres:// or postgresql://.`);
  }
  return parsed;
};

const source = parseDatabaseUrl(sourceValue, 'SOURCE_DB_URL');
const target = parseDatabaseUrl(targetValue, 'TARGET_DB_URL');
const sourceIdentity = `${source.hostname}/${source.username}`;
const targetIdentity = `${target.hostname}/${target.username}`;

if (sourceIdentity === targetIdentity || sourceValue === targetValue) {
  throw new Error('Refusing to reset staging because source and target identify the same database.');
}

process.stdout.write(`Target guard passed for staging host ${target.hostname}.\n`);
