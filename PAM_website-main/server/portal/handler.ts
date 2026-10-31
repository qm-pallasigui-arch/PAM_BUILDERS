import type { VercelRequest, VercelResponse } from '@vercel/node';
import { compare, hash } from 'bcryptjs';
import { put, get, del } from '@vercel/blob';
import { z, ZodError } from 'zod';
import { database, transaction, type Database, type Queryable } from './db.js';
import { HttpError, authenticate, newSession, projectAccess, roles, sameOrigin, sessionToken, setCookie, sign } from './security.js';
import * as v from './validation.js';
import * as q from './queries.js';
import { contentRoute } from './content.js';

const managers = ['admin', 'project_manager'];
const notFound = () => { throw new HttpError(404, 'Not found.'); };
const must = (ok: unknown, message: string) => { if (!ok) throw new HttpError(400, message); };
function page(res: VercelResponse, rows: any[], limit: number, extra = {}) {
  const items = rows.slice(0, limit);
  return res.json({ items, nextCursor: rows.length > limit ? items.at(-1).id : null, ...extra });
}
async function assignments(db: Queryable, projectId: number, ids: number[]) {
  const unique = [...new Set(ids)];
  if (unique.length) {
    const users = await db.query('SELECT id FROM users WHERE id=ANY($1::int[])', [unique]);
    must(users.rows.length === unique.length, 'An assigned user does not exist.');
  }
  await db.query('DELETE FROM project_assignments WHERE project_id=$1', [projectId]);
  for (const uid of unique) await db.query('INSERT INTO project_assignments(project_id,user_id) VALUES($1,$2)', [projectId, uid]);
}
async function validatePermits(db:Queryable,projectId:number,permits:z.infer<typeof v.permitInput>[]) {
  for(const permit of permits){
    must(!permit.issuedDate || !permit.expiryDate || permit.expiryDate>=permit.issuedDate,'Permit expiry cannot precede its issue date.');
    if(permit.attachment)must((await db.query('SELECT id FROM content_assets WHERE id=$1 AND project_id=$2',[Number(permit.attachment.split('/').pop()),projectId])).rows.length,'Upload the permit attachment for this project first.');
  }
}
export function createHandler(injected?: Database, storage = { put, get, del }) {
  return async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    try {
      sameOrigin(req);
      const db = injected ?? database();
      const rawPath = req.query.path;
      const path = (Array.isArray(rawPath) ? rawPath.join('/') : rawPath ?? new URL(req.url ?? '/', 'http://localhost').pathname.replace(/^\/api\/portal\/?/, '')).replace(/^\/|\/$/g, '');
      const method = req.method;
      if (path === 'login' && method === 'POST') {
        const input = v.loginInput.parse(req.body);
        // Persistent, atomic limits across serverless instances, keyed by email and trusted proxy IP.
        const ip = String(req.headers['x-vercel-forwarded-for'] ?? req.socket?.remoteAddress ?? 'unknown').split(',')[0];
        const keys = [sign(`email:${input.email}`), sign(`ip:${ip}`)];
        for (const [index, key] of keys.entries()) {
          const { rows } = await db.query(`INSERT INTO login_attempts(key,attempts,reset_at) VALUES($1,1,now()+interval '15 minutes')
            ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN login_attempts.reset_at<=now() THEN 1 ELSE login_attempts.attempts+1 END,
            reset_at=CASE WHEN login_attempts.reset_at<=now() THEN now()+interval '15 minutes' ELSE login_attempts.reset_at END RETURNING attempts`, [key]);
          if (rows[0].attempts > (index === 0 ? 10 : 100)) throw new HttpError(429, 'Too many sign-in attempts. Try again in 15 minutes.');
        }
        const { rows } = await db.query(`SELECT ${q.userColumns},password_hash FROM users WHERE lower(email)=$1`, [input.email]);
        const row = rows[0];
        // Fixed valid bcrypt hash also performs work for unknown accounts.
        const valid = await compare(input.password, row?.password_hash ?? '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW');
        if (!row || !valid || row.status !== 'active') throw new HttpError(401, 'Invalid email or password.');
        await newSession(db, row.id, res);
        const { password_hash: _, ...user } = row;
        return res.json({ user });
      }
      if (await contentRoute(db,req,res,path)) return;
      const user = await authenticate(db, req);
      if (path === 'me' && method === 'GET') return res.json({ user });
      if (path === 'logout' && method === 'POST') {
        await db.query('DELETE FROM portal_sessions WHERE token_hash=$1', [sign(sessionToken(req)!)]);
        setCookie(res, '', 0);
        return res.json({ ok: true });
      }
      const { limit, after } = v.pagination(req.query);
      const parts = path.split('/');
      const resource = parts[0];
      const rowId = parts[1] && parts[1] !== 'photo' ? v.id.parse(parts[1]) : undefined;
      const projectFilter = req.query.project_id === undefined ? null : v.id.parse(req.query.project_id);
      if (projectFilter) await projectAccess(db, user, projectFilter);

      if (resource === 'users' && parts.length <= 2) {
        roles(user, 'admin');
        if (method === 'GET' && !rowId) return page(res, (await db.query(`SELECT ${q.userColumns} FROM users WHERE id>$1 ORDER BY id LIMIT $2`, [after, limit + 1])).rows, limit);
        if (method === 'POST' && !rowId) {
          const input = v.userInput.parse({status:'active',...req.body});
          const { rows } = await db.query(`INSERT INTO users(name,email,password_hash,role,status) VALUES($1,$2,$3,$4,$5) RETURNING ${q.userColumns}`, [input.name,input.email,await hash(input.password,12),input.role,input.status]);
          return res.status(201).json(rows[0]);
        }
        if (method === 'PUT' && rowId) {
          const input = v.userInput.partial().parse(req.body);
          must(!(rowId === user.id && (input.status === 'inactive' || (input.role && input.role !== 'admin'))), 'You cannot deactivate or demote your own account.');
          const result = await transaction(db, async tx => {
            const { rows } = await tx.query(`SELECT ${q.userColumns} FROM users WHERE id=$1 FOR UPDATE`, [rowId]);
            if (!rows[0]) return notFound();
            const merged = { ...rows[0], ...input };
            const updated = await tx.query(`UPDATE users SET name=$2,email=$3,role=$4,status=$5,password_hash=COALESCE($6,password_hash) WHERE id=$1 RETURNING ${q.userColumns}`,
              [rowId,merged.name,merged.email,merged.role,merged.status,input.password ? await hash(input.password,12) : null]);
            if (input.password || input.role || input.status) await tx.query('DELETE FROM portal_sessions WHERE user_id=$1', [rowId]);
            return updated.rows[0];
          });
          return res.json(result);
        }
      }
      if (resource === 'projects') {
        if (method === 'GET' && parts.length === 1) {
          const { rows } = await db.query(`SELECT ${q.projectColumns} FROM projects p WHERE p.id>$1 AND
            ($2::boolean OR EXISTS(SELECT 1 FROM project_assignments a WHERE a.project_id=p.id AND a.user_id=$3)) ORDER BY p.id LIMIT $4`, [after,user.role !== 'site_staff',user.id,limit+1]);
          const sites = await db.query(`SELECT ${q.siteColumns} FROM sites WHERE project_id=ANY($1::int[]) ORDER BY id`, [rows.slice(0,limit).map(p => p.id)]);
          return page(res, rows, limit, { sites: sites.rows });
        }
        if (method === 'POST' && parts.length === 1) {
          roles(user, 'admin');
          const input = v.projectInput.extend({ siteName: z.string().trim().min(1).max(200), siteAddress: z.string().trim().max(255), assignedUserIds: z.array(v.id).max(500).optional() }).parse({client:'',location:'',endDate:null,...req.body});
          must(!input.endDate || input.endDate >= input.startDate, 'End date cannot precede start date.');
          const result = await transaction(db, async tx => {
            const { rows } = await tx.query(`INSERT INTO projects(name,client,location,start_date,end_date,budget,status,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, [input.name,input.client,input.location,input.startDate,input.endDate,input.budget,input.status,user.id]);
            const pid = rows[0].id;
            await validatePermits(tx,pid,input.permits??[]);
            await tx.query('UPDATE projects SET category=$2,color=$3,permits=$4 WHERE id=$1',[pid,input.category ?? 'General',input.color ?? null,JSON.stringify(input.permits ?? [])]);
            await tx.query('INSERT INTO sites(project_id,name,address) VALUES($1,$2,$3)', [pid,input.siteName,input.siteAddress]);
            await assignments(tx,pid,[user.id,...(input.assignedUserIds ?? [])]);
            return (await tx.query(`SELECT ${q.projectColumns} FROM projects p WHERE id=$1`, [pid])).rows[0];
          });
          return res.status(201).json(result);
        }
        if (rowId) {
          await projectAccess(db,user,rowId);
          if (method === 'GET' && parts.length === 2) return res.json({ ...(await db.query(`SELECT ${q.projectColumns} FROM projects p WHERE id=$1`, [rowId])).rows[0], sites: (await db.query(`SELECT ${q.siteColumns} FROM sites WHERE project_id=$1 ORDER BY id`, [rowId])).rows });
          if (method === 'POST' && parts.length === 3 && parts[2] === 'sites') {
            roles(user,...managers);
            const input = v.siteInput.parse(req.body);
            return res.status(201).json((await db.query(`INSERT INTO sites(project_id,name,address) VALUES($1,$2,$3) RETURNING ${q.siteColumns}`, [rowId,input.name,input.address])).rows[0]);
          }
          if (method === 'PUT' && parts.length === 2) {
            roles(user,...managers);
            const input = v.projectInput.partial().extend({ assignedUserIds: z.array(v.id).max(500).optional() }).parse(req.body);
            if (input.assignedUserIds) roles(user,'admin');
            const result = await transaction(db,async tx => {
              const old = (await tx.query(`SELECT ${q.projectColumns} FROM projects p WHERE id=$1 FOR UPDATE`, [rowId])).rows[0];
              const p = { ...old,...input };
              must(!p.endDate || p.endDate >= p.startDate, 'End date cannot precede start date.');
              await tx.query('UPDATE projects SET name=$2,client=$3,location=$4,start_date=$5,end_date=$6,budget=$7,status=$8 WHERE id=$1', [rowId,p.name,p.client,p.location,p.startDate,p.endDate,p.budget,p.status]);
              await validatePermits(tx,rowId,p.permits);
              await tx.query('UPDATE projects SET category=$2,color=$3,permits=$4 WHERE id=$1',[rowId,p.category,p.color,JSON.stringify(p.permits)]);
              if (input.assignedUserIds) await assignments(tx,rowId,input.assignedUserIds);
              return (await tx.query(`SELECT ${q.projectColumns} FROM projects p WHERE id=$1`, [rowId])).rows[0];
            });
            return res.json(result);
          }
        }
      }
      if (resource === 'milestones' && parts.length <= 2) {
        if (method === 'GET' && !rowId) return page(res,(await db.query(`SELECT ${q.milestoneColumns} FROM milestones WHERE id>$1 AND ($2::int IS NULL OR project_id=$2)
          AND ($3::boolean OR project_id IN (SELECT project_id FROM project_assignments WHERE user_id=$4)) ORDER BY id LIMIT $5`, [after,projectFilter,user.role !== 'site_staff',user.id,limit+1])).rows,limit);
        roles(user,...managers);
        if (method === 'POST' && !rowId) {
          const m = v.milestoneInput.parse({description:'',...req.body});
          await projectAccess(db,user,m.projectId);
          return res.status(201).json((await db.query(`INSERT INTO milestones(project_id,title,description,due_date,status,completed_at) VALUES($1,$2,$3,$4,$5::milestone_status,CASE WHEN $5::text='completed' THEN now() ELSE NULL END) RETURNING ${q.milestoneColumns}`, [m.projectId,m.title,m.description,m.dueDate,m.status])).rows[0]);
        }
        if (method === 'PUT' && rowId) {
          const patch = v.milestoneInput.omit({projectId:true}).partial().parse(req.body);
          const result = await transaction(db,async tx => {
            const old = (await tx.query(`SELECT ${q.milestoneColumns} FROM milestones WHERE id=$1 FOR UPDATE`,[rowId])).rows[0];
            if (!old) return notFound();
            const m = {...old,...patch};
            return (await tx.query(`UPDATE milestones SET title=$2,description=$3,due_date=$4,status=$5::milestone_status,completed_at=CASE WHEN $5::text='completed' THEN COALESCE(completed_at,now()) ELSE NULL END WHERE id=$1 RETURNING ${q.milestoneColumns}`, [rowId,m.title,m.description,m.dueDate,m.status])).rows[0];
          });
          return res.json(result);
        }
      }
      if (resource === 'reports') {
        if (method === 'GET' && parts.length === 1) return page(res,(await db.query(`SELECT ${q.reportColumns} FROM progress_reports r WHERE r.id>$1 AND ($2::int IS NULL OR r.project_id=$2)
          AND ($3::boolean OR r.project_id IN(SELECT project_id FROM project_assignments WHERE user_id=$4)) ORDER BY r.id LIMIT $5`, [after,projectFilter,user.role !== 'site_staff',user.id,limit+1])).rows,limit);
        if (method === 'POST' && path === 'reports/photo') {
          const input = v.photoInput.parse(req.body);
          await projectAccess(db,user,input.projectId,true);
          must((await db.query('SELECT id FROM sites WHERE id=$1 AND project_id=$2',[input.siteId,input.projectId])).rows.length, 'Site does not belong to this project.');
          let bytes: Buffer;
          try { bytes = v.validateImage(input.data,input.contentType); } catch { throw new HttpError(400,'Use a JPEG, PNG or WebP image up to 3 MB.'); }
          const blob = await storage.put(`portal/${input.projectId}/${user.id}/photo`,bytes,{access:'private',addRandomSuffix:true,contentType:input.contentType});
          try {
            await db.query('INSERT INTO photo_uploads(project_id,site_id,uploaded_by,blob_url,content_type) VALUES($1,$2,$3,$4,$5)', [input.projectId,input.siteId,user.id,blob.url,input.contentType]);
          } catch (error) { await storage.del(blob.url); throw error; }
          return res.status(201).json({url:blob.url});
        }
        if (method === 'GET' && rowId && parts.length === 3 && parts[2] === 'photo') {
          const report = (await db.query('SELECT project_id,photo_url FROM progress_reports WHERE id=$1',[rowId])).rows[0];
          if (!report?.photo_url) return notFound();
          await projectAccess(db,user,report.project_id);
          const blob = await storage.get(report.photo_url,{access:'private'});
          if (!blob || blob.statusCode !== 200) return notFound();
          res.setHeader('Content-Type',blob.blob.contentType);
          res.setHeader('X-Content-Type-Options','nosniff');
          return res.send(Buffer.from(await new Response(blob.stream).arrayBuffer()));
        }
        if (method === 'POST' && parts.length === 1) {
          const r = v.reportInput.parse(req.body);
          const reportId = await transaction(db,async tx => {
            await projectAccess(tx,user,r.projectId,!r.correctionReason);
            if (r.correctionReason) roles(user,'admin');
            await tx.query('SELECT id FROM projects WHERE id=$1 FOR UPDATE',[r.projectId]);
            const previous = (await tx.query('SELECT percent_complete FROM progress_reports WHERE project_id=$1 ORDER BY id DESC LIMIT 1',[r.projectId])).rows[0];
            must(!!r.correctionReason || r.percentComplete >= (previous?.percent_complete ?? 0),'Progress cannot decrease. An admin correction with a reason is required.');
            must((await tx.query('SELECT id FROM sites WHERE id=$1 AND project_id=$2',[r.siteId,r.projectId])).rows.length,'Site does not belong to this project.');
            if (r.photoDataUrl) must((await tx.query('SELECT id FROM photo_uploads WHERE blob_url=$1 AND project_id=$2 AND site_id=$3 AND uploaded_by=$4',[r.photoDataUrl,r.projectId,r.siteId,user.id])).rows.length,'Upload this photo for the selected site first.');
            const { rows } = await tx.query('INSERT INTO progress_reports(project_id,site_id,submitted_by,report_date,description,percent_complete,photo_url) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',[r.projectId,r.siteId,user.id,r.reportDate,r.description,r.percentComplete,r.photoDataUrl]);
            const rid = rows[0].id;
            if(r.correctionReason) await tx.query('UPDATE progress_reports SET correction_reason=$2 WHERE id=$1',[rid,r.correctionReason]);
            for (const m of r.materials) await tx.query('INSERT INTO materials_log(report_id,project_id,material_name,quantity,unit) VALUES($1,$2,$3,$4,$5)',[rid,r.projectId,m.materialName,m.quantity,m.unit]);
            for (const m of r.manpower) await tx.query('INSERT INTO manpower_log(report_id,project_id,worker_name,position,hours_worked) VALUES($1,$2,$3,$4,$5)',[rid,r.projectId,m.workerName,m.position,m.hoursWorked]);
            await tx.query("INSERT INTO notifications(message,type,ref_type,ref_id) VALUES($1,'info','project',$2)",[`New progress report submitted by ${user.name}.`,r.projectId]);
            return rid;
          });
          return res.status(201).json((await db.query(`SELECT ${q.reportColumns} FROM progress_reports r WHERE id=$1`,[reportId])).rows[0]);
        }
      }
      if (resource === 'notifications') {
        if (method === 'GET' && parts.length === 1) {
          roles(user,...managers);
          const stored = await db.query(`SELECT n.id,n.message,n.type,EXISTS(SELECT 1 FROM notification_reads r WHERE r.notification_id=n.id AND r.user_id=$1) AS "isRead",n.created_at AS "createdAt"
            FROM notifications n WHERE n.id>$2 AND (n.user_id IS NULL OR n.user_id=$1) ORDER BY n.id LIMIT $3`,[user.id,after,limit+1]);
          const delays = after === 0 ? (await db.query(`SELECT -m.id AS id,'Milestone "' || m.title || '" (' || p.name || ') is overdue; due ' || m.due_date::text AS message,
            'delay' AS type,false AS "isRead",m.created_at AS "createdAt" FROM milestones m JOIN projects p ON p.id=m.project_id
            WHERE m.due_date < (now() AT TIME ZONE 'Asia/Manila')::date AND m.status!='completed' ORDER BY m.due_date,m.id`)).rows : [];
          return page(res,stored.rows,limit,{delayAlerts:delays});
        }
        if (method === 'PUT' && rowId && parts.length === 3 && parts[2] === 'read') {
          const { rows } = await db.query('SELECT id FROM notifications WHERE id=$1 AND (user_id=$2 OR (user_id IS NULL AND $3::boolean))',[rowId,user.id,user.role !== 'site_staff']);
          if (!rows.length) return notFound();
          await db.query('INSERT INTO notification_reads(notification_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[rowId,user.id]);
          return res.json({ok:true});
        }
      }
      throw new HttpError(405,'Method or endpoint not supported.');
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json({error:error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')});
      if (error instanceof HttpError) return res.status(error.status).json({error:error.message});
      const code = (error as {code?: string})?.code;
      if (code === '23505') return res.status(409).json({error:'This record already exists.'});
      if (code === '23503' || code === '23514') return res.status(400).json({error:'Invalid related record or value.'});
      console.error('Portal request failed', error instanceof Error ? error.name : 'Unknown error');
      return res.status(500).json({error:'Unable to complete the request. Check server configuration or try again.'});
    }
  };
}
