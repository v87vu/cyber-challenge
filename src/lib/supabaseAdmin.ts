import 'server-only';

export function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function supabaseRest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !serviceKey) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }

  const headers = new Headers(init.headers);
  headers.set('apikey', serviceKey);
  headers.set('Authorization', 'Bearer ' + serviceKey);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(baseUrl + '/rest/v1/' + path, {
    ...init,
    cache: 'no-store',
    headers,
  });

  if (!response.ok) {
    const details = await response.text();
    console.error('Supabase REST error:', response.status, details);
    throw new Error('SUPABASE_' + response.status);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
