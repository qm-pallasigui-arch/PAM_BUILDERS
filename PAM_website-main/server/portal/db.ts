import { Pool, types } from 'pg';

// Keep DATE values as calendar dates and numeric values compatible with the UI.
types.setTypeParser(1082, value => value);
types.setTypeParser(1700, Number);
export interface Queryable {
  query(text: string, values?: any[]): Promise<{ rows: any[]; rowCount?: number | null }>;
}
export interface Database extends Queryable {
  connect(): Promise<Queryable & { release(): void }>;
}
let pool: Pool | undefined;
export function database(): Database {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000 });
}
export async function transaction<T>(db: Database, work: (client: Queryable) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
