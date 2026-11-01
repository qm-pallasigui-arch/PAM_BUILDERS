import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from './auth';
import { usePortalData } from './data';
import { AddCard } from './AddCard';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';

export function ReportCreateAction({ projectId }: { projectId?: number }) {
  const { user, hasRole } = useAuth();
  const { projects } = usePortalData();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const eligible = projects.filter(p => (!p.approvalStatus || p.approvalStatus === 'approved') && user && (hasRole('admin') || p.assignedUserIds?.includes(user.id)));
  const selected = projectId !== undefined ? eligible.find(p => p.id === projectId) : (eligible.length === 1 ? eligible[0] : undefined);
  if (projectId !== undefined && !selected) return null;
  if (!eligible.length) return null;
  const to = selected ? `/portal/projects/${selected.id}/submit-report` : undefined;
  return <>
    <AddCard buttonRef={trigger} title="Add progress report" description={selected ? `Record site progress for ${selected.name}.` : 'Choose a project and record its latest site progress.'} {...(to ? { to } : { onClick: () => setOpen(true) })} />
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent onCloseAutoFocus={event => { if (trigger.current) { event.preventDefault(); trigger.current.focus(); } }}><DialogHeader><DialogTitle>Choose a project</DialogTitle><DialogDescription>Select the project for your new progress report.</DialogDescription></DialogHeader>
        <div className="max-h-80 space-y-2 overflow-y-auto">{eligible.map(p => <Link key={p.id} className="portal-interactive block rounded-lg border p-3" to={`/portal/projects/${p.id}/submit-report`} onClick={() => setOpen(false)}><span className="block font-medium">{p.name}</span><span className="text-sm text-gray-600">{p.location}</span></Link>)}</div>
      </DialogContent>
    </Dialog>
  </>;
}
