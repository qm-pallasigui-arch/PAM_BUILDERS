import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../src/app/portal/Button';
import { PortalDataBoundary } from '../src/app/portal/ContentState';
import { createDemoApi } from '../src/app/portal/demo';
import { isMilestoneDelayed, latestProgress } from '../src/app/portal/utils';
import type { Milestone } from '../src/app/portal/types';
import type { ProgressReport } from '../src/app/portal/types';
import { AddCard } from '../src/app/portal/AddCard';
import { PermitStatusBadge } from '../src/app/portal/PermitStatusBadge';

const boundary = (hasLoaded: boolean, loading: boolean, error: string | null) => renderToStaticMarkup(
  createElement(PortalDataBoundary, { hasLoaded, loading, error, refresh: async () => {}, children: createElement('input', { defaultValue: 'Unsaved draft' }) }),
);

test('add cards expose a named native button and approval badges retain text meaning', () => {
  const card = renderToStaticMarkup(createElement(AddCard, { title: 'Add project', description: 'Set up a project.', onClick: () => {} }));
  assert.match(card, /<button type="button"/);
  assert.match(card, /Add project/);
  const approved = renderToStaticMarkup(createElement(PermitStatusBadge, { status: 'approved' }));
  assert.match(approved, /Approved/);
  assert.match(approved, /aria-hidden="true"/);
});

test('official progress excludes pending and rejected reports while retaining historical records', () => {
  const reports = [
    { id: 1, projectId: 1, percentComplete: 20 },
    { id: 2, projectId: 1, percentComplete: 30, approvalStatus: 'approved' },
    { id: 3, projectId: 1, percentComplete: 50, approvalStatus: 'pending' },
    { id: 4, projectId: 1, percentComplete: 60, approvalStatus: 'rejected' },
  ] as ProgressReport[];
  assert.equal(latestProgress(1, reports), 30);
  assert.equal(latestProgress(1, reports.slice(2)), 0);
});

test('initial loading and failure never display empty data or editable page content', () => {
  const loading = boundary(false, true, null);
  assert.match(loading, /Loading portal data/);
  assert.doesNotMatch(loading, /Unsaved draft/);
  const failed = boundary(false, false, 'Connection unavailable');
  assert.match(failed, /role="alert"/);
  assert.match(failed, /Retry loading/);
  assert.doesNotMatch(failed, /Unsaved draft/);
});

test('refresh and stale-data errors retain page content and provide recovery feedback', () => {
  assert.match(boundary(true, false, null), /Unsaved draft/);
  const refreshing = boundary(true, true, null);
  assert.match(refreshing, /Unsaved draft/);
  assert.match(refreshing, /Refreshing data/);
  const failed = boundary(true, false, 'Connection unavailable');
  assert.match(failed, /Unsaved draft/);
  assert.match(failed, /may be out of date/);
  assert.match(failed, /Retry refresh/);
});

test('loading actions are disabled and expose their busy state and operation label', () => {
  const busy = renderToStaticMarkup(createElement(Button, { loading: true, loadingLabel: 'Creating project...' }, 'Create project'));
  assert.match(busy, /disabled=""/);
  assert.match(busy, /aria-busy="true"/);
  assert.match(busy, /Creating project/);
  const ready = renderToStaticMarkup(createElement(Button, {}, 'Create project'));
  assert.doesNotMatch(ready, /disabled=""|aria-busy/);
});

test('milestones can start and complete while overdue stays a separate derived state', () => {
  const api = createDemoApi();
  api('login', 'POST', { email: 'admin@pambuilders.com', password: 'admin123' });
  api('milestones', 'POST', { projectId: 1, title: 'State regression', description: '', dueDate: '2000-01-01', status: 'pending' });
  const list = () => (api('milestones') as { items: Milestone[] }).items;
  const milestone = list().find(m => m.title === 'State regression')!;
  assert.equal(isMilestoneDelayed(milestone), true);
  api(`milestones/${milestone.id}`, 'PUT', { status: 'in_progress' });
  const started = list().find(m => m.id === milestone.id)!;
  assert.equal(started.status, 'in_progress');
  assert.equal(isMilestoneDelayed(started), true);
  api(`milestones/${milestone.id}`, 'PUT', { status: 'completed' });
  const completed = list().find(m => m.id === milestone.id)!;
  assert.equal(completed.status, 'completed');
  assert.equal(isMilestoneDelayed(completed), false);
  assert.ok(completed.completedAt);
});
