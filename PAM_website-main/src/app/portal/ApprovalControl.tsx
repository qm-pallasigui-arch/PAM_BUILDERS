import { useRef, useState } from 'react';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from './api';
import { useAuth } from './auth';
import { usePortalData } from './data';
import type { ApprovalRecord, ApprovalStatus } from './types';
import { Badge } from '../components/ui/badge';
import { Button } from './Button';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';

export function ApprovalBadge({ status = 'approved' }: { status?: ApprovalStatus }) {
  const state = {
    pending: { label: 'Awaiting approval', Icon: Clock3, style: 'border-amber-200 bg-amber-50 text-amber-900' },
    approved: { label: 'Approved', Icon: CheckCircle2, style: 'border-green-200 bg-green-50 text-green-800' },
    rejected: { label: 'Rejected', Icon: XCircle, style: 'border-red-200 bg-red-50 text-red-800' },
  }[status];
  return <Badge variant="outline" className={state.style}><state.Icon aria-hidden="true" />{state.label}</Badge>;
}

export function ApprovalControl({ resource, record }: { resource: 'projects' | 'reports'; record: ApprovalRecord & { id: number } }) {
  const { hasRole } = useAuth();
  const { refresh } = usePortalData();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const review = async (status: ApprovalStatus) => {
    if (lock.current) return;
    if (status === 'rejected' && !reason.trim()) { setError('Enter a reason so the submitter knows what to correct.'); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      await api(`${resource}/${record.id}/approval`, 'PUT', { status, reason });
      await refresh(); setOpen(false); setReason('');
      toast.success(status === 'pending' ? 'Submitted for admin approval.' : status === 'approved' ? 'Approved.' : 'Rejected with feedback.');
    } catch (e) { setError((e as Error).message); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div className="space-y-2">
    <div className="flex flex-wrap items-center gap-2"><ApprovalBadge status={record.approvalStatus} />
      {record.approvalStatus === 'pending' && hasRole('admin') && <Button variant="outline" onClick={() => setOpen(true)}>Review {resource === 'projects' ? 'project' : 'report'}</Button>}
      {record.approvalStatus === 'rejected' && resource === 'projects' && hasRole('admin', 'project_manager') && <Button variant="outline" loading={busy} loadingLabel="Submitting..." onClick={() => void review('pending')}>Resubmit for approval</Button>}
    </div>
    {record.approvalStatus === 'pending' && <p className="text-xs text-amber-900">{resource === 'projects' ? 'Hidden from site staff until approved.' : 'Excluded from official progress until approved.'}</p>}
    {record.approvalReason && <p className="text-sm text-gray-700">Review feedback: {record.approvalReason}</p>}
    {record.approvalStatus === 'rejected' && <p className="text-xs text-gray-600">{resource === 'projects' ? 'Update the project details, then resubmit for approval.' : 'Submit a new corrected report to request another review. This report remains in the history.'}</p>}
    {record.reviewedAt && record.approvalStatus !== 'pending' && <p className="text-xs text-gray-500">Reviewed {new Date(record.reviewedAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} (Manila time)</p>}
    {!open && error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <Dialog open={open} onOpenChange={value => { if (!busy) { setOpen(value); setError(''); } }}>
      <DialogContent><DialogHeader><DialogTitle>Review {resource === 'projects' ? 'project' : 'progress report'}</DialogTitle><DialogDescription>{resource === 'projects' ? 'Approval makes this project available to assigned site staff.' : 'Approval includes this report in official project progress.'} A rejection requires feedback.</DialogDescription></DialogHeader>
        <label className="space-y-2">Review feedback<Textarea maxLength={2000} disabled={busy} value={reason} onChange={e => setReason(e.target.value)} placeholder="Required when rejecting" /></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-2"><Button loading={busy} loadingLabel="Saving review..." onClick={() => void review('approved')}>Approve</Button><Button variant="destructive" disabled={busy} onClick={() => void review('rejected')}>Reject</Button><Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button></div>
      </DialogContent>
    </Dialog>
  </div>;
}
