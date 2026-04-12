import fs from 'node:fs'
import path from 'node:path'

function loadEnvFile(filename) {
  const filePath = path.join(process.cwd(), filename)
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) continue

    const key = line.slice(0, separatorIndex).trim()
    if (!key || process.env[key]) continue

    let value = line.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

for (const filename of ['.env.production.local', '.env.local', '.env.production', '.env']) {
  loadEnvFile(filename)
}

function validateDatabaseUrl(value) {
  const raw = value?.trim()
  if (!raw) {
    return { ok: false, message: 'must be set to a PostgreSQL connection string' }
  }

  const normalized = raw.replace(/^['"]|['"]$/g, '')
  let parsed
  try {
    parsed = new URL(normalized)
  } catch {
    return { ok: false, message: 'must be a valid URL (example: postgresql://user:pass@host:5432/db?schema=public)' }
  }

  if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
    return { ok: false, message: 'must start with postgresql:// or postgres://' }
  }

  if (!parsed.hostname || parsed.hostname.toLowerCase() === 'base') {
    return { ok: false, message: 'hostname is invalid (current value is unresolved)' }
  }

  if (!parsed.pathname || parsed.pathname === '/') {
    return { ok: false, message: 'database name is missing in URL path' }
  }

  return { ok: true, message: '' }
}

const requiredEnv = [
  {
    key: 'DATABASE_URL',
    validate: (value) => validateDatabaseUrl(value).ok,
    message: (value) => validateDatabaseUrl(value).message,
  },
  {
    key: 'SESSION_SECRET',
    validate: (value) => Boolean(value?.trim()) && value.trim().length >= 32,
    message: () => 'must be set and at least 32 characters long',
  },
]

const failures = requiredEnv
  .filter(({ key, validate }) => !validate(process.env[key]))
  .map(({ key, message }) => `${key} ${message(process.env[key])}`)

if (failures.length > 0) {
  console.error('Runtime environment check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Runtime environment check passed.')
