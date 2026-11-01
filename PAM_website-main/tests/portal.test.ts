import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { hash } from 'bcryptjs';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHandler } from '../server/portal/handler.js';
import type { Database } from '../server/portal/db.js';
import { date, validateImage } from '../server/portal/validation.js';
import { isMilestoneDelayed } from '../src/app/portal/utils.js';

process.env.SESSION_SECRET = 'test-only-session-secret-with-at-least-32-characters';
const pg = new PGlite();
const db: Database = {
  query: async (sql,values) => { const result = await pg.query(sql,values); return {rows:result.rows,rowCount:result.affectedRows}; },
  connect: async () => ({...db,release:()=>{}}),
};
const blobBytes = Buffer.from([137,80,78,71,13,10,26,10,0]);
// Only the external Blob transport is replaced; authorization and persistence use real SQL.
const storage = {
  put: async () => ({url:'https://test.private.blob.vercel-storage.com/portal/test-photo'}),
  get: async () => ({statusCode:200,blob:{contentType:'image/png'},stream:new ReadableStream({start(controller){controller.enqueue(blobBytes);controller.close();}})}),
  del: async () => {},
} as unknown as NonNullable<Parameters<typeof createHandler>[1]>;
const handler = createHandler(db,storage);
const cookies: Record<string,string> = {};
async function request(path: string,method='GET',body: unknown={},cookie='',origin='http://localhost') {
  let code = 200; let output: any; const headers: Record<string,string> = {};
  const url = new URL('/api/portal/'+path,'http://localhost');
  const req = {url:url.pathname+url.search,method,body,query:Object.fromEntries(url.searchParams),headers:{host:'localhost',origin,'content-type':'application/json',cookie},socket:{remoteAddress:'127.0.0.1'}} as VercelRequest;
  const res = {setHeader:(key:string,value:string)=>{headers[key.toLowerCase()]=value;},status:(value:number)=>{code=value;return res;},json:(value:unknown)=>{output=value;return res;},send:(value:unknown)=>{output=value;return res;}} as unknown as VercelResponse;
  await handler(req,res);
  return {status:code,body:output,headers};
}
before(async () => {
  await pg.exec(await readFile(new URL('../db/schema.sql',import.meta.url),'utf8'));
  const password = await hash('test-password-123',4);
  for (const [index,role] of ['admin','project_manager','site_staff','site_staff'].entries()) {
    await db.query('INSERT INTO users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)',[index+1,role,role+index+'@example.com',password,role]);
    const result = await request('login','POST',{email:role+index+'@example.com',password:'test-password-123'});
    assert.equal(result.status,200);
    assert.ok(!('password_hash' in result.body.user));
    cookies[index+1]=result.headers['set-cookie'].split(';')[0];
  }
  await db.query("SELECT setval('users_id_seq',4)");
  for (const name of ['Assigned project','Private project']) {
    const result = await request('projects','POST',{name,client:'Client',location:'Manila',startDate:'2026-01-01',endDate:null,budget:100,status:'ongoing',siteName:'Main site',siteAddress:'Manila',assignedUserIds:name==='Assigned project' ? [2,3] : []},cookies[1]);
    assert.equal(result.status,201);
  }
});
after(async()=>{await pg.close();});

test('all protected API families reject anonymous callers and forged cookies',async()=>{
  for (const path of ['me','users','projects','projects/1','milestones','reports','notifications']) assert.equal((await request(path)).status,401,path);
  assert.equal((await request('me','GET',{},cookies[1]+'forged')).status,401);
  assert.equal((await request('login','POST',{email:'admin0@example.com',password:'wrong'})).status,401);
});
test('CSRF protection rejects cross-origin and missing-origin writes',async()=>{
  for (const origin of ['https://attacker.example','']) assert.equal((await request('logout','POST',{},cookies[1],origin)).status,403);
});
test('staff see only assigned projects, sites, and reports and cannot mutate privileged resources',async()=>{
  const result = await request('projects','GET',{},cookies[3]);
  assert.deepEqual(result.body.items.map((p:any)=>p.id),[1]);
  assert.deepEqual(result.body.sites.map((s:any)=>s.projectId),[1]);
  assert.equal((await request('projects/2','GET',{},cookies[3])).status,404);
  for (const path of ['users','notifications']) assert.equal((await request(path,'GET',{},cookies[3])).status,403);
  for (const path of ['users','projects','milestones','projects/1/sites']) assert.equal((await request(path,'POST',{},cookies[3])).status,403);
  assert.equal((await request('projects/1','PUT',{name:'Attack'},cookies[3])).status,403);
  assert.equal((await request('reports?project_id=2','GET',{},cookies[3])).status,404);
  assert.deepEqual((await request('projects','GET',{},cookies[4])).body.items,[]);
});
const report = {projectId:1,siteId:1,reportDate:'2026-10-06',description:'Concrete poured',percentComplete:45,photoDataUrl:null,submittedBy:1,submittedByName:'Forged name',materials:[{materialName:'Cement',quantity:4.5,unit:'bags'}],manpower:[{workerName:'Worker',position:'Mason',hoursWorked:8}]};
test('report creation persists nested rows and binds author to session',async()=>{
  const result = await request('reports','POST',report,cookies[3]);
  assert.equal(result.status,201,JSON.stringify(result.body));
  assert.equal(result.body.submittedBy,3);
  assert.equal(result.body.materials[0].quantity,4.5);
  assert.equal(result.body.manpower[0].hoursWorked,8);
  const list = await request('reports?project_id=1','GET',{},cookies[3]);
  assert.equal(list.body.items.length,1);
});
test('report submission validates assignment, site ownership, ranges, dates, and photo provenance',async()=>{
  assert.equal((await request('reports','POST',report,cookies[4])).status,404);
  assert.equal((await request('reports','POST',{...report,projectId:2,siteId:2},cookies[2])).status,404);
  for (const patch of [{siteId:2},{percentComplete:101},{reportDate:'2026-02-30'},{photoDataUrl:'https://attacker.example/photo.png'},{materials:[{materialName:'Cement',quantity:-1,unit:'bags'}]},{manpower:[{workerName:'Worker',position:'Mason',hoursWorked:25}]}]) {
    assert.equal((await request('reports','POST',{...report,...patch},cookies[3])).status,400,JSON.stringify(patch));
  }
});
test('database failure in nested manpower write rolls back report and material rows',async()=>{
  await pg.exec("CREATE FUNCTION fail_test_manpower() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$; CREATE TRIGGER fail_test BEFORE INSERT ON manpower_log FOR EACH ROW EXECUTE FUNCTION fail_test_manpower();");
  const before = (await db.query('SELECT count(*)::int AS count FROM progress_reports')).rows[0].count;
  const materialsBefore = (await db.query('SELECT count(*)::int AS count FROM materials_log')).rows[0].count;
  assert.equal((await request('reports','POST',report,cookies[3])).status,500);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM progress_reports')).rows[0].count,before);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM materials_log')).rows[0].count,materialsBefore);
  await pg.exec('DROP TRIGGER fail_test ON manpower_log; DROP FUNCTION fail_test_manpower();');
});
test('project edits, sites, assignments and stable pagination work',async()=>{
  const first = await request('projects?limit=1','GET',{},cookies[1]);
  assert.equal(first.body.items.length,1); assert.equal(first.body.nextCursor,1);
  const next = await request('projects?limit=1&after=1','GET',{},cookies[1]);
  assert.equal(next.body.items[0].id,2); assert.equal(next.body.nextCursor,null);
  assert.equal((await request('projects/1/sites','POST',{name:'East wing',address:'Manila'},cookies[2])).status,201);
  assert.equal((await request('projects/1','PUT',{status:'on_hold'},cookies[2])).status,200);
  const detail = await request('projects/1','GET',{},cookies[2]);
  assert.equal(detail.body.client,'Client');
  assert.equal(detail.body.location,'Manila');
  assert.equal((await request('projects/1','PUT',{assignedUserIds:[4]},cookies[2])).status,403);
  assert.equal((await request('projects/1','PUT',{assignedUserIds:[1,2,3,4]},cookies[1])).status,200);
  assert.equal((await request('projects','GET',{},cookies[4])).body.items.length,1);
});
test('milestone delay rule excludes today and completed work; read receipts are per user',async()=>{
  for (const [title,dueDate,status] of [['Overdue','2000-01-01','pending'],['Done','2000-01-01','completed'],['Future','2099-01-01','pending']]) {
    assert.equal((await request('milestones','POST',{projectId:1,title,description:'Test',dueDate,status},cookies[2])).status,201);
  }
  const notifications = await request('notifications','GET',{},cookies[1]);
  assert.equal(notifications.body.delayAlerts.length,1);
  const nid = notifications.body.items[0].id;
  assert.equal((await request('notifications/'+nid+'/read','PUT',{},cookies[1])).status,200);
  assert.equal((await request('notifications','GET',{},cookies[1])).body.items[0].isRead,true);
  assert.equal((await request('notifications','GET',{},cookies[2])).body.items[0].isRead,false);
  assert.equal((await request('notifications/'+nid+'/read','PUT',{},cookies[3])).status,404);
  assert.equal((await request('milestones/1','PUT',{status:'completed'},cookies[2])).status,200);
  const milestones = await request('milestones','GET',{},cookies[2]);
  assert.equal(milestones.body.items[0].description,'Test');
  assert.equal((await request('notifications','GET',{},cookies[1])).body.delayAlerts.length,0);
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  assert.equal(isMilestoneDelayed({id:1,projectId:1,title:'Today',description:'',dueDate:today,status:'pending',completedAt:null}),false);
});
test('admin user changes hash passwords, reject duplicates, and revoke sessions',async()=>{
  const created = await request('users','POST',{name:'New Staff',email:'NEW@example.com',password:'safe-test-password-123',role:'site_staff'},cookies[1]);
  assert.equal(created.status,201);
  assert.equal(created.body.email,'new@example.com');
  assert.ok(!('password_hash' in created.body));
  const stored = (await db.query('SELECT password_hash FROM users WHERE id=$1',[created.body.id])).rows[0];
  assert.ok(stored.password_hash.startsWith('$2'));
  assert.equal((await request('users','POST',{name:'Duplicate',email:'new@example.com',password:'safe-test-password-123',role:'site_staff'},cookies[1])).status,409);
  assert.equal((await request('users/1','PUT',{status:'inactive'},cookies[1])).status,400);
  assert.equal((await request('users/4','PUT',{status:'inactive'},cookies[1])).status,200);
  const renamed = await request('users/4','PUT',{name:'Renamed inactive user'},cookies[1]);
  assert.equal(renamed.status,200);
  assert.equal(renamed.body.status,'inactive');
  assert.equal((await request('me','GET',{},cookies[4])).status,401);
});
test('logout revokes server session even if the old cookie is replayed',async()=>{
  const login = await request('login','POST',{email:'site_staff2@example.com',password:'test-password-123'});
  const cookie = login.headers['set-cookie'].split(';')[0];
  assert.match(login.headers['set-cookie'],/HttpOnly; SameSite=Strict/);
  assert.equal((await request('logout','POST',{},cookie)).status,200);
  assert.equal((await request('me','GET',{},cookie)).status,401);
});
test('persistent rate limits and invalid upload bytes are rejected',async()=>{
  let response;
  for (let i=0;i<11;i++) response = await request('login','POST',{email:'unknown@example.com',password:'invalid'});
  assert.equal(response!.status,429);
  assert.throws(()=>validateImage(Buffer.from('<svg onload="alert(1)">').toString('base64'),'image/png'));
  assert.equal((await request('reports/photo','POST',{projectId:1,siteId:1,contentType:'image/png',data:'invalid'},cookies[3])).status,400);
  assert.equal(date.safeParse('2026-02-30').success,false);
});

test('private photo upload is owned by a site and served only through authorized report access',async()=>{
  const upload = await request('reports/photo','POST',{projectId:2,siteId:2,contentType:'image/png',data:blobBytes.toString('base64')},cookies[1]);
  assert.equal(upload.status,201);
  const result = await request('reports','POST',{...report,projectId:2,siteId:2,photoDataUrl:upload.body.url},cookies[1]);
  assert.equal(result.status,201);
  const path = 'reports/'+result.body.id+'/photo';
  assert.equal(result.body.photoDataUrl,'/api/portal/'+path);
  assert.equal((await request(path)).status,401);
  assert.equal((await request(path,'GET',{},cookies[3])).status,404);
  const photo = await request(path,'GET',{},cookies[1]);
  assert.equal(photo.status,200);
  assert.equal(photo.headers['content-type'],'image/png');
  assert.deepEqual(photo.body,blobBytes);
  assert.equal((await request('reports','POST',{...report,photoDataUrl:upload.body.url},cookies[3])).status,400);
});

test('upgrade migration applies to the original schema and matches fresh installation',async()=>{
  const upgrade = new PGlite();
  try {
    const schema = await readFile(new URL('../db/schema.sql',import.meta.url),'utf8');
    await upgrade.exec(schema.split('-- Apply after the original portal schema')[0]);
    await upgrade.exec(await readFile(new URL('../db/migrations/002_portal_backend.sql',import.meta.url),'utf8'));
    await upgrade.exec(await readFile(new URL('../db/migrations/003_project_management.sql',import.meta.url),'utf8'));
    await upgrade.exec("INSERT INTO users(id,name,email,password_hash,role) VALUES(1,'Historical admin','historical@example.com','test','admin'); INSERT INTO projects(id,name) VALUES(1,'Historical project'); INSERT INTO progress_reports(id,project_id,submitted_by,report_date) VALUES(1,1,1,'2026-01-01');");
    await upgrade.exec(await readFile(new URL('../db/migrations/004_approvals.sql',import.meta.url),'utf8'));
    assert.equal((await upgrade.query<{approval_status:string}>('SELECT approval_status FROM projects WHERE id=1')).rows[0].approval_status,'approved');
    assert.equal((await upgrade.query<{approval_status:string}>('SELECT approval_status FROM progress_reports WHERE id=1')).rows[0].approval_status,'approved');
    await upgrade.exec("INSERT INTO projects(id,name) VALUES(2,'New pending project');");
    await upgrade.exec(await readFile(new URL('../db/migrations/004_approvals.sql',import.meta.url),'utf8'));
    assert.equal((await upgrade.query<{approval_status:string}>('SELECT approval_status FROM projects WHERE id=2')).rows[0].approval_status,'pending');
    const columns = "SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position";
    assert.deepEqual((await upgrade.query(columns)).rows,(await pg.query(columns)).rows);
  } finally {await upgrade.close();}
});


test('editing and reporting preserve project identity and enforce progress floors with audited corrections',async()=>{
 const created=await request('projects','POST',{name:'Identity regression',client:'Retained client',location:'Cebu',startDate:'2026-01-01',endDate:null,budget:1500,status:'ongoing',siteName:'Main',siteAddress:'Cebu',category:'Commercial',color:'#123456',assignedUserIds:[3]},cookies[1]);
 assert.equal(created.status,201);const project=created.body;
 const before=(await request('projects','GET',{},cookies[1])).body.items.length;
 const updated=await request(`projects/${project.id}`,'PUT',{name:'Edited name',endDate:'2027-01-01'},cookies[1]);
 assert.equal(updated.body.id,project.id);assert.equal(updated.body.client,'Retained client');assert.equal(updated.body.budget,1500);assert.equal(updated.body.color,'#123456');
 const input={...report,projectId:project.id,siteId:project.siteIds[0],percentComplete:50};
 const pending=await request('reports','POST',input,cookies[3]); assert.equal(pending.status,201);
 assert.equal((await request(`reports/${pending.body.id}/approval`,'PUT',{status:'approved'},cookies[1])).status,200);
 assert.equal((await request('reports','POST',{...input,percentComplete:40},cookies[3])).status,400);
 assert.equal((await request('reports','POST',{...input,percentComplete:60},cookies[3])).status,201);
 assert.equal((await request('reports','POST',{...input,correctionReason:' '},cookies[1])).status,400);
 assert.equal((await request('reports','POST',{...input,correctionReason:'Wrong measurement'},cookies[3])).status,403);
 const correction=await request('reports','POST',{...input,percentComplete:45,correctionReason:'Verified measurement correction'},cookies[1]);
 assert.equal(correction.status,201);assert.equal(correction.body.correctionReason,'Verified measurement correction');assert.equal(correction.body.submittedBy,1);
 assert.equal((await request('reports','POST',{...input,percentComplete:44},cookies[3])).status,400);
 assert.equal((await request('reports','POST',{...input,percentComplete:46,reportDate:'2026-01-01'},cookies[3])).status,201);
 assert.equal((await request('projects','GET',{},cookies[1])).body.items.length,before);
 const history=(await request(`reports?project_id=${project.id}`,'GET',{},cookies[1])).body.items;
 assert.equal(history.length,4);
});

test('website publication filters drafts and private fields and governs file visibility',async()=>{
 assert.equal((await request('content','GET',{},cookies[3])).status,403);
 const seeded=(await request('content','GET',{},cookies[1])).body;assert.equal(seeded.projects.length,9);
 assert.equal((await request('content','PUT',seeded,cookies[1])).status,200);
 assert.equal((await request('public-content')).body.projects.length,9);
 const upload=await request('assets','POST',{name:'cover.png',contentType:'image/png',data:blobBytes.toString('base64')},cookies[1]);assert.equal(upload.status,201);
 const assetPath=upload.body.url.replace('/api/portal/','');
 assert.equal((await request(assetPath)).status,401);
 const project={id:'public-one',title:'Portfolio',description:'Public description',image:upload.body.url,category:'General',color:null,order:0,published:false,linkedProjectId:1,showClient:false,showBudget:false,showLocation:false};
 const content={projects:[project],categories:[{name:'General',color:'#ea580c'}],permitTemplates:['Building permit'],birUrl:''};
 assert.equal((await request('content','PUT',content,cookies[1])).status,200);
 assert.equal((await request('public-content')).body.projects.length,0);
 project.published=true;project.showLocation=true;
 assert.equal((await request('content','PUT',content,cookies[1])).status,200);
 const publicProject=(await request('public-content')).body.projects[0];
 assert.ok(publicProject.location);assert.equal(publicProject.budget,undefined);assert.equal(publicProject.client,undefined);assert.equal(publicProject.linkedProjectId,undefined);
 assert.equal((await request(assetPath)).status,200);
 project.published=false;
 assert.equal((await request('content','PUT',content,cookies[1])).status,200);
 assert.equal((await request(assetPath)).status,401);
 assert.deepEqual((await request('permit-templates','GET',{},cookies[3])).body,['Building permit']);
 assert.equal((await request('content','PUT',{...content,projects:[]},cookies[1])).status,200);
 assert.equal((await request('content','GET',{},cookies[1])).body.projects.length,0);
});

test('permits retain status and attachments on project edits and reject another project file',async()=>{
 const uploaded=await request('assets','POST',{name:'permit.pdf',contentType:'application/pdf',data:Buffer.from('%PDF-1.7 test').toString('base64'),projectId:1},cookies[1]);assert.equal(uploaded.status,201);
 const permit={name:'Building permit',status:'approved',reference:'BP-1',issuedDate:'2026-01-01',expiryDate:'2027-01-01',attachment:uploaded.body.url};
 assert.equal((await request('projects/1','PUT',{permits:[permit]},cookies[1])).status,200);
 const edited=await request('projects/1','PUT',{category:'Residential',color:null},cookies[1]);assert.deepEqual(edited.body.permits,[permit]);
 assert.equal((await request('projects/2','PUT',{permits:[permit]},cookies[1])).status,400);
 const path=uploaded.body.url.replace('/api/portal/','');
 const unassignedLogin=await request('login','POST',{email:'new@example.com',password:'safe-test-password-123'});
 const unassignedCookie=unassignedLogin.headers['set-cookie'].split(';')[0];
 assert.equal((await request(path)).status,401);assert.equal((await request(path,'GET',{},unassignedCookie)).status,404);assert.equal((await request(path,'GET',{},cookies[3])).status,200);
 assert.equal((await request('projects/1','PUT',{permits:[{...permit,expiryDate:'2025-01-01'}]},cookies[1])).status,400);
});


test('About and Contact content supports ordered cards and publishes only saved leadership photos',async()=>{
 const old=(await request('content','GET',{},cookies[1])).body;
 assert.equal(old.leadership[0].name,'Ronald M. Milana');assert.equal(old.contact.cards[0].kind,'phone');
 const upload=await request('assets','POST',{name:'leader.png',contentType:'image/png',data:blobBytes.toString('base64')},cookies[1]);
 assert.equal(upload.status,201);
 const path=upload.body.url.replace('/api/portal/','');assert.equal((await request(path)).status,401);
 const leadership=[{id:'new-leader',name:'New Leader',role:'Director',experience:'10 years',image:upload.body.url},...old.leadership];
 const contact={...old.contact,title:'Talk to PAM',cards:[{id:'new-email',kind:'email',title:'Project inquiries',lines:['projects@example.com'],note:'Contact our project team'}],emergency:{...old.contact.emergency,enabled:false}};
 assert.equal((await request('content','PUT',{leadership,contact},cookies[3])).status,403);
 assert.equal((await request('content','PUT',{leadership,contact},cookies[1])).status,200);
 let published=(await request('public-content')).body;
 assert.deepEqual(published.leadership,leadership);assert.deepEqual(published.contact,contact);assert.equal((await request(path)).status,200);
 assert.equal((await request('content','PUT',{contact:{...contact,cards:[{...contact.cards[0],lines:['javascript:alert(1)']}]}},cookies[1])).status,400);
 const changed=[{...leadership[1],role:'Founder'},leadership[0]];
 assert.equal((await request('content','PUT',{leadership:changed},cookies[1])).status,200);
 published=(await request('public-content')).body;assert.equal(published.leadership[0].role,'Founder');assert.equal(published.contact.title,'Talk to PAM');
 assert.equal((await request('content','PUT',{leadership:[],contact:{...contact,cards:[]}},cookies[1])).status,200);
 published=(await request('public-content')).body;assert.deepEqual(published.leadership,[]);assert.deepEqual(published.contact.cards,[]);assert.equal((await request(path)).status,401);
});


test('admin approvals gate project access and report progress with audited decisions', async () => {
  const created = await request('projects','POST',{name:'Approval workflow',client:'Client',location:'Manila',startDate:'2026-01-01',endDate:null,budget:100,status:'ongoing',siteName:'Main',siteAddress:'Manila',approvalStatus:'approved'},cookies[2]);
  assert.equal(created.status,201,JSON.stringify(created.body));
  const project = created.body;
  assert.equal(project.approvalStatus,'pending');
  await request(`projects/${project.id}`,'PUT',{assignedUserIds:[2,3],approvalStatus:'approved'},cookies[1]);
  assert.equal((await request(`projects/${project.id}`,'GET',{},cookies[3])).status,404);
  assert.ok(!(await request('projects','GET',{},cookies[3])).body.items.some((p:any)=>p.id===project.id));
  const input = {...report,projectId:project.id,siteId:project.siteIds[0],percentComplete:20};
  assert.equal((await request('reports','POST',input,cookies[2])).status,400);
  assert.equal((await request(`projects/${project.id}/approval`,'PUT',{status:'approved'},cookies[2])).status,403);
  assert.equal((await request(`projects/${project.id}/approval`,'PUT',{status:'rejected'},cookies[1])).status,400);
  assert.equal((await request(`projects/${project.id}/approval`,'PUT',{status:'rejected',reason:'Confirm the budget'},cookies[1])).status,200);
  assert.equal((await request(`projects/${project.id}/approval`,'PUT',{status:'pending'},cookies[2])).status,200);
  assert.equal((await request(`projects/${project.id}/approval`,'PUT',{status:'approved'},cookies[1])).status,200);
  assert.equal((await request(`projects/${project.id}`,'GET',{},cookies[3])).status,200);
  const pending = await request('reports','POST',{...input,approvalStatus:'approved'},cookies[3]);
  assert.equal(pending.status,201); assert.equal(pending.body.approvalStatus,'pending');
  assert.equal((await request(`reports/${pending.body.id}/approval`,'PUT',{status:'approved'},cookies[2])).status,403);
  assert.equal((await request(`reports/${pending.body.id}/approval`,'PUT',{status:'approved'},cookies[1])).status,200);
  const approved = (await request(`reports?project_id=${project.id}`,'GET',{},cookies[3])).body.items[0];
  assert.equal(approved.approvalStatus,'approved'); assert.equal(approved.reviewedBy,1); assert.ok(approved.reviewedAt);
  const lower = await request('reports','POST',{...input,percentComplete:10},cookies[3]); assert.equal(lower.status,400);
  const older = await request('reports','POST',{...input,percentComplete:30},cookies[3]);
  const newer = await request('reports','POST',{...input,percentComplete:40},cookies[3]);
  assert.equal((await request(`reports/${newer.body.id}/approval`,'PUT',{status:'approved'},cookies[1])).status,200);
  assert.equal((await request(`reports/${older.body.id}/approval`,'PUT',{status:'approved'},cookies[1])).status,400);
  assert.equal((await request(`reports/${older.body.id}/approval`,'PUT',{status:'rejected',reason:'Superseded'},cookies[1])).status,200);
  const audit = await db.query("SELECT * FROM approval_events WHERE resource='projects' AND record_id=$1 ORDER BY id",[project.id]);
  assert.deepEqual(audit.rows.map(r=>r.status),['rejected','pending','approved']);
  const adminReport = await request('reports','POST',{...input,percentComplete:50,correctionReason:'Admin verified'},cookies[1]);
  assert.equal(adminReport.body.approvalStatus,'approved');
});
