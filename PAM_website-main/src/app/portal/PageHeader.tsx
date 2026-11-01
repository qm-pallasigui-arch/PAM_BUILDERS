import type { ReactNode } from 'react';

export function PageHeader({ title, description, section = 'PAM Builders Portal', actions, children }: {
  title: ReactNode; description: ReactNode; section?: string; actions?: ReactNode; children?: ReactNode;
}) {
  return <header className="w-full rounded-xl border border-orange-200 border-l-4 border-l-orange-600 bg-orange-50 px-5 py-6 sm:px-7 sm:py-7">
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div className="min-w-0 flex-1 basis-64">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-orange-800">{section}</p>
        <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight text-gray-950 sm:text-3xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">{description}</p>
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </header>;
}
