export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  if (import.meta.env.MODE === 'demo') {
    const { demoApi } = await import('./demo');
    return demoApi(path, method, body) as T;
  }
  const response = await fetch('/api/portal/' + path, {
    method, credentials: 'same-origin', headers: method === 'GET' ? {} : { 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
  });
  const result = await response.json().catch(() => ({error: 'The portal API is unavailable. Please try again.'}));
  if (!response.ok) {
    if (response.status === 401 && path !== 'login' && path !== 'me') window.dispatchEvent(new Event('portal-session-expired'));
    throw new ApiError(response.status, result.error ?? 'Request failed.');
  }
  return result as T;
}
export interface Page<T> { items: T[]; nextCursor: number | null }
export async function allPages<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  let after = 0;
  do {
    const page = await api<Page<T>>(path + (path.includes('?') ? '&' : '?') + 'after=' + after + '&limit=100');
    items.push(...page.items);
    if (page.nextCursor === null) return items;
    after = page.nextCursor;
  } while (true);
}
export async function uploadPhoto(file: File, projectId: number, siteId: number) {
  if (file.size > 3 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Use a JPEG, PNG or WebP image up to 3 MB.');
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Unable to read the photo.'));
    reader.readAsDataURL(file);
  });
  if (import.meta.env.MODE === 'demo') return `data:${file.type};base64,${data}`;
  return (await api<{url:string}>('reports/photo','POST',{projectId,siteId,contentType:file.type,data})).url;
}
