export async function api<T = any>(url: string, opts: { method?: string; body?: any } = {}): Promise<T> {
  const r = await fetch(url, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && typeof window !== 'undefined' && !url.includes('/auth/login')) {
    window.location.href = '/login';
  }
  if (!r.ok) throw Object.assign(new Error(j.error || 'Xatolik yuz berdi'), { data: j });
  return j as T;
}
