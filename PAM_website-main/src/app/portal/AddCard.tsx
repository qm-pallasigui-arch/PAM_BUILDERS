import type { Ref } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router';

type AddCardProps = { title: string; description: string; buttonRef?: Ref<HTMLButtonElement> } & (
  { to: string; onClick?: never } | { to?: never; onClick: () => void }
);

export function AddCard({ title, description, to, onClick, buttonRef }: AddCardProps) {
  const className = 'portal-interactive group flex min-h-36 w-full items-center gap-4 rounded-xl border-2 border-dashed border-orange-200 bg-white p-6 text-left';
  const content = <>
    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-700 group-hover:bg-orange-100 group-focus-visible:bg-orange-100"><Plus aria-hidden="true" className="size-6" /></span>
    <span><span className="block font-semibold text-orange-800">{title}</span><span className="mt-1 block text-sm text-gray-600">{description}</span></span>
  </>;
  return to !== undefined ? <Link to={to} className={className}>{content}</Link> : <button ref={buttonRef} type="button" onClick={onClick} className={className}>{content}</button>;
}
