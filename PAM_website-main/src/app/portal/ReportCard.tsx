import { Camera, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ApprovalControl } from './ApprovalControl';
import { formatDate } from './utils';
import type { ProgressReport } from './types';

export function ReportCard({ report: r, projectName }: { report: ProgressReport; projectName: string }) {
  return <article aria-label={`${projectName} report for ${formatDate(r.reportDate)}`} className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
    <Card className="min-w-0"><CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><CardTitle className="text-base">{projectName}</CardTitle><p className="mt-1 text-sm text-gray-600">{formatDate(r.reportDate)} · {r.submittedByName}</p></div>
        <Badge variant="active">{r.percentComplete}% {r.approvalStatus && r.approvalStatus !== 'approved' ? 'reported' : 'complete'}</Badge>
      </div>
    </CardHeader><CardContent className="space-y-4">
      <div><h3 className="text-sm font-semibold">Work completed</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">{r.description}</p></div>
      {r.correctionReason && <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">Admin correction: {r.correctionReason}</p>}
      {r.materials.length > 0 && <div><h3 className="mb-2 text-sm font-semibold">Materials used</h3><div className="flex flex-wrap gap-2">{r.materials.map((m,i) => <Badge key={i} variant="outline" className="whitespace-normal">{m.materialName}: {m.quantity} {m.unit}</Badge>)}</div></div>}
      {r.manpower.length > 0 && <div><h3 className="mb-2 text-sm font-semibold">Manpower</h3><div className="flex flex-wrap gap-2">{r.manpower.map((m,i) => <Badge key={i} variant="outline" className="whitespace-normal">{m.workerName}{m.position ? ` (${m.position})` : ''} · {m.hoursWorked}h</Badge>)}</div></div>}
      <div className="border-t pt-4"><ApprovalControl resource="reports" record={r} /></div>
    </CardContent></Card>
    <Card className="min-w-0"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Camera aria-hidden="true" className="size-4 text-orange-700" />Site photo</CardTitle><p className="text-xs text-gray-600">{projectName} · {formatDate(r.reportDate)}</p></CardHeader>
      <CardContent>{r.photoDataUrl ? <figure><a className="portal-interactive block overflow-hidden rounded-lg border" href={r.photoDataUrl} target="_blank" rel="noreferrer" aria-label={`Open site photo for ${projectName}, ${formatDate(r.reportDate)} (new tab)`}><img src={r.photoDataUrl} alt={`Site progress for ${projectName} on ${formatDate(r.reportDate)}`} loading="lazy" className="aspect-[4/3] w-full bg-gray-50 object-contain" /><span className="flex items-center justify-center gap-2 border-t p-3 text-sm font-medium text-orange-800">View full photo<ExternalLink aria-hidden="true" className="size-4" /></span></a></figure> : <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed bg-gray-50 p-6 text-center text-sm text-gray-500">No site photo attached to this report.</div>}</CardContent>
    </Card>
  </article>;
}
