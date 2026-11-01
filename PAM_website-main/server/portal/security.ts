import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Queryable } from './db.js';
import type { PortalUser } from '../../src/app/portal/types.js';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters');
  return value;
}
export function sign(value: string) { return createHmac('sha256', secret()).update(value).digest('base64url'); }
export function sessionToken(req: VercelRequest): string | null {
  const cookie = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('pam_session='))?.slice(12);
  if (!cookie) return null;
  const [token, signature, extra] = cookie.split('.');
  if (extra || !token || !signature) return null;
  const expected = Buffer.from(sign(token));
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected) ? token : null;
}
export function setCookie(res: VercelResponse, value: string, maxAge: number) {
  res.setHeader('Set-Cookie', `pam_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}
export async function newSession(db: Queryable, userId: number, res: VercelResponse) {
  const token = randomBytes(32).toString('base64url');
  await db.query("INSERT INTO portal_sessions (token_hash,user_id,expires_at) VALUES ($1,$2,now() + interval '8 hours')", [sign(token), userId]);
  setCookie(res, `${token}.${sign(token)}`, 8 * 3600);
}
export async function authenticate(db: Queryable, req: VercelRequest): Promise<PortalUser> {
  const token = sessionToken(req);
  if (!token) throw new HttpError(401, 'Please sign in.');
  const { rows } = await db.query(`SELECT u.id,u.name,u.email,u.role,u.status FROM users u JOIN portal_sessions s ON s.user_id=u.id
    WHERE s.token_hash=$1 AND s.expires_at>now() AND u.status='active'`, [sign(token)]);
  if (!rows[0]) throw new HttpError(401, 'Your session has expired. Please sign in.');
  return rows[0];
}
export function roles(user: PortalUser, ...allowed: string[]) {
  if (!allowed.includes(user.role)) throw new HttpError(403, 'You do not have permission for this action.');
}
export function sameOrigin(req: VercelRequest) {
  if (req.method === 'GET') return;
  const origin = req.headers.origin;
  let allowed = false;
  try { allowed = typeof origin === 'string' && new URL(origin).host === req.headers.host; } catch { /* reject malformed origins */ }
  if (!allowed) throw new HttpError(403, 'A same-origin request is required.');
  if (!req.headers['content-type']?.startsWith('application/json')) throw new HttpError(415, 'Use application/json.');
}
export async function projectAccess(db: Queryable, user: PortalUser, projectId: number, assigned = false) {
  const { rows } = await db.query(`SELECT id FROM projects p WHERE id=$1 AND ($4::boolean OR p.approval_status='approved') AND
    ($2::boolean OR EXISTS (SELECT 1 FROM project_assignments a WHERE a.project_id=p.id AND a.user_id=$3))`,
    [projectId, !assigned && user.role !== 'site_staff', user.id, user.role !== 'site_staff']);
  if (!rows.length) throw new HttpError(404, 'Project not found or not assigned to you.');
}
