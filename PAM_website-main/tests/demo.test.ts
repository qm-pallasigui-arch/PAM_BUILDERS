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
