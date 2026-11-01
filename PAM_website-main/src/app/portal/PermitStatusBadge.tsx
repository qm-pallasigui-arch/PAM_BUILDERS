import { CheckCircle2, Clock3, Send, AlertTriangle } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import type { Permit } from './types';

const states = {
  pending: { label: 'Pending', Icon: Clock3, className: 'border-gray-200 bg-gray-50 text-gray-700' },
  submitted: { label: 'Submitted', Icon: Send, className: 'border-blue-200 bg-blue-50 text-blue-800' },
  approved: { label: 'Approved', Icon: CheckCircle2, className: 'border-green-200 bg-green-50 text-green-800' },
  expired: { label: 'Expired', Icon: AlertTriangle, className: 'border-red-200 bg-red-50 text-red-800' },
};
export function PermitStatusBadge({ status }: { status: Permit['status'] }) {
  const { label, Icon, className } = states[status];
  return <Badge variant="outline" className={className}><Icon aria-hidden="true" />{label}</Badge>;
}
