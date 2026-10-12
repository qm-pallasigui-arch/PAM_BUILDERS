import { Pool } from 'pg';
import { hash } from 'bcryptjs';
import { DEMO_USERS, DEMO_PROJECTS, DEMO_SITES, DEMO_MILESTONES, DEMO_REPORTS, DEMO_NOTIFICATIONS } from '../src/app/portal/mockData.js';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in .env first.');
const allowDemo = process.argv.includes('--allow-demo-passwords');
const passwords = [process.env.SEED_ADMIN_PASSWORD,process.env.SEED_PM_PASSWORD,process.env.SEED_STAFF_PASSWORD];
if (!allowDemo && passwords.some(p => !p || p.length < 12 || Buffer.byteLength(p) > 72)) throw new Error('Set all three SEED_*_PASSWORD values (12-72 bytes), or explicitly pass --allow-demo-passwords for a disposable demo.');
const pool = new Pool({connectionString:process.env.DATABASE_URL});
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(72641006)');
  const existing = await client.query('SELECT id FROM users LIMIT 1');
  if (existing.rows.length) throw new Error('Seed requires an empty database; existing accounts and project data were not changed.');
  for (const [i,u] of DEMO_USERS.entries()) await client.query('INSERT INTO users(id,name,email,password_hash,role,status) VALUES($1,$2,$3,$4,$5,$6)',[u.id,u.name,u.email,await hash(passwords[i] || u.password,12),u.role,u.status]);
  for (const p of DEMO_PROJECTS) {
    await client.query('INSERT INTO projects(id,name,client,location,start_date,end_date,budget,status,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,1)',[p.id,p.name,p.client,p.location,p.startDate,p.endDate,p.budget,p.status]);
    for (const u of DEMO_USERS) await client.query('INSERT INTO project_assignments(project_id,user_id) VALUES($1,$2)',[p.id,u.id]);
  }
  for (const s of DEMO_SITES) await client.query('INSERT INTO sites(id,project_id,name,address) VALUES($1,$2,$3,$4)',[s.id,s.projectId,s.name,s.address]);
  for (const m of DEMO_MILESTONES) await client.query('INSERT INTO milestones(id,project_id,title,description,due_date,status,completed_at) VALUES($1,$2,$3,$4,$5,$6,$7)',[m.id,m.projectId,m.title,m.description,m.dueDate,m.status,m.completedAt]);
  for (const r of DEMO_REPORTS) {
    await client.query('INSERT INTO progress_reports(id,project_id,site_id,submitted_by,report_date,description,percent_complete) VALUES($1,$2,$3,$4,$5,$6,$7)',[r.id,r.projectId,r.siteId,r.submittedBy,r.reportDate,r.description,r.percentComplete]);
    for (const m of r.materials) await client.query('INSERT INTO materials_log(report_id,project_id,material_name,quantity,unit) VALUES($1,$2,$3,$4,$5)',[r.id,r.projectId,m.materialName,m.quantity,m.unit]);
    for (const m of r.manpower) await client.query('INSERT INTO manpower_log(report_id,project_id,worker_name,position,hours_worked) VALUES($1,$2,$3,$4,$5)',[r.id,r.projectId,m.workerName,m.position,m.hoursWorked]);
  }
  for (const n of DEMO_NOTIFICATIONS) await client.query('INSERT INTO notifications(id,message,type,is_read,created_at) VALUES($1,$2,$3,$4,$5)',[n.id,n.message,n.type,n.isRead,n.createdAt]);
  for (const table of ['users','projects','sites','milestones','progress_reports','notifications']) await client.query(`SELECT setval(pg_get_serial_sequence('${table}','id'), (SELECT max(id) FROM ${table}))`);
  await client.query('COMMIT');
  console.log('Seeded demo projects and accounts. Passwords were hashed and are not printed.');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { client.release(); await pool.end(); }
