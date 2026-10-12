import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in .env first.');
const pool = new Pool({connectionString:process.env.DATABASE_URL});
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(72641006)');
  await client.query('CREATE TABLE IF NOT EXISTS portal_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  const applied = await client.query("SELECT name FROM portal_migrations WHERE name='002_portal_backend'");
  if (!applied.rows.length) {
    const existing = await client.query("SELECT to_regclass('public.users') AS users, to_regclass('public.portal_sessions') AS sessions");
    if (!existing.rows[0].users) await client.query(await readFile(new URL('../db/schema.sql',import.meta.url),'utf8'));
    else if (!existing.rows[0].sessions) await client.query(await readFile(new URL('../db/migrations/002_portal_backend.sql',import.meta.url),'utf8'));
    await client.query("INSERT INTO portal_migrations(name) VALUES('002_portal_backend')");
  }
  await client.query('COMMIT');
  console.log('Portal schema is up to date.');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { client.release(); await pool.end(); }
