import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoApi } from '../src/app/portal/demo';

test('demo authenticates fixture accounts and restricts site staff administration', () => {
  const api = createDemoApi();
  assert.throws(() => api('projects'), /sign in/);
  assert.throws(() => api('login','POST',{email:'admin@pambuilders.com',password:'wrong'}), /Invalid/);
  const result = api('login','POST',{email:'site@pambuilders.com',password:'site123'}) as any;
  assert.equal(result.user.role,'site_staff');
  assert.equal(result.user.password,undefined);
  assert.throws(() => api('users'), /Admin/);
  assert.throws(() => api('milestones','POST',{}), /Manager/);
  assert.ok((api('projects') as any).items.length > 0);
  api('logout','POST');
  assert.throws(() => api('me'), /sign in/);
});

test('demo edits survive navigation, new accounts can log in, and a fresh instance resets', () => {
  const api = createDemoApi();
  api('login','POST',{email:'admin@pambuilders.com',password:'admin123'});
  api('projects/1','PUT',{name:'Demo edit'});
  assert.equal((api('projects') as any).items[0].name,'Demo edit');
  api('users','POST',{name:'Demo staff',email:'demo@example.com',password:'demo-password',role:'site_staff',status:'active'});
  api('logout','POST');
  api('login','POST',{email:'demo@example.com',password:'demo-password'});
  assert.equal((api('projects') as any).items.length,0);
  assert.throws(() => api('reports','POST',{projectId:1}), /assigned/);
  const fresh = createDemoApi();
  fresh('login','POST',{email:'admin@pambuilders.com',password:'admin123'});
  assert.notEqual((fresh('projects') as any).items[0].name,'Demo edit');
  assert.equal((fresh('users') as any).items.length,3);
});


test('demo About and Contact edits appear on the public pages without creating new project records',()=>{
 const api=createDemoApi();api('login','POST',{email:'admin@pambuilders.com',password:'admin123'});
 const content=api('content') as any;const projectCount=(api('projects') as any).items.length;
 content.leadership.push({id:'new',name:'New Leader',role:'Director',experience:'',image:''});
 content.contact.cards[0].lines=['+63 912 345 6789'];api('content','PUT',content);
 const published=api('public-content') as any;assert.equal(published.leadership.at(-1).name,'New Leader');assert.equal(published.contact.cards[0].lines[0],'+63 912 345 6789');assert.equal((api('projects') as any).items.length,projectCount);
});


test('demo approvals mirror manager submission, staff gating, and admin review', () => {
  const api=createDemoApi();
  api('login','POST',{email:'pm@pambuilders.com',password:'pm123'});
  api('projects','POST',{name:'Pending demo',siteName:'Main',siteAddress:'Manila',approvalStatus:'approved'});
  const project=(api('projects') as any).items.find((p:any)=>p.name==='Pending demo');
  assert.equal(project.approvalStatus,'pending');
  assert.throws(()=>api(`projects/${project.id}/approval`,'PUT',{status:'approved'}),/Admin/);
  api('login','POST',{email:'admin@pambuilders.com',password:'admin123'});
  api(`projects/${project.id}`,'PUT',{assignedUserIds:[2,3]});
  api('login','POST',{email:'site@pambuilders.com',password:'site123'});
  assert.ok(!(api('projects') as any).items.some((p:any)=>p.id===project.id));
  api('login','POST',{email:'admin@pambuilders.com',password:'admin123'});
  api(`projects/${project.id}/approval`,'PUT',{status:'approved'});
  api('login','POST',{email:'site@pambuilders.com',password:'site123'});
  api('reports','POST',{projectId:project.id,siteId:project.siteIds[0],percentComplete:25,approvalStatus:'approved'});
  const pending=(api('reports') as any).items.find((r:any)=>r.projectId===project.id);
  assert.equal(pending.approvalStatus,'pending');
  api('login','POST',{email:'admin@pambuilders.com',password:'admin123'});
  api(`reports/${pending.id}/approval`,'PUT',{status:'approved'});
  assert.equal((api('reports') as any).items.find((r:any)=>r.id===pending.id).approvalStatus,'approved');
});
