import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Button } from './Button';

export function ContentState({ title, description, kind = 'empty', action }: {
  title: string; description: string; kind?: 'empty' | 'error' | 'loading'; action?: ReactNode;
}) {
  const Icon = kind === 'error' ? AlertTriangle : kind === 'loading' ? Loader2 : Inbox;
  return <section role={kind === 'error' ? 'alert' : 'status'} className="rounded-lg border border-gray-200 bg-white p-8 text-center">
    <Icon aria-hidden="true" className={`mx-auto mb-3 h-7 w-7 ${kind === 'error' ? 'text-red-600' : 'text-gray-400'} ${kind === 'loading' ? 'animate-spin motion-reduce:animate-none' : ''}`} />
    <h2 className="font-semibold text-gray-900">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">{description}</p>
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </section>;
}

// Keep the child mounted after the first load so refreshing never discards drafts.
export function PortalDataBoundary({ hasLoaded, loading, error, refresh, children }: {
  hasLoaded: boolean; loading: boolean; error: string | null; refresh: () => Promise<void>; children: ReactNode;
}) {
  if (!hasLoaded) return error
    ? <ContentState kind="error" title="Unable to load the portal" description={error} action={<Button onClick={() => void refresh()}>Retry loading</Button>} />
    : <ContentState kind="loading" title="Loading portal data" description="Getting your projects, reports, and milestones ready." />;
  return <>
    <div aria-live="polite" aria-atomic="true">
      {loading && <p className="mb-4 text-sm text-gray-600">Refreshing data. You can continue working.</p>}
      {error && <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
        <p className="font-medium">Could not refresh. Displayed data may be out of date.</p>
        <p className="mt-1 text-sm">{error}</p>
        <Button className="mt-3" variant="outline" onClick={() => void refresh()}>Retry refresh</Button>
      </div>}
    </div>
    {children}
  </>;
}
