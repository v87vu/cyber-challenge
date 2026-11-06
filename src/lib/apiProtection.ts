type Bucket = { tokens: number; updatedAt: number };

// Each server process owns its buckets. Deploy behind a proxy that overwrites IP headers.
export function createIpLimiter(capacity: number, periodMs: number) {
  const buckets = new Map<string, Bucket>();
  return (request: Request, now = Date.now()): Response | null => {
    const ip = (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() || 'unknown').slice(0, 128);
    for (const [key, bucket] of buckets) {
      if (now - bucket.updatedAt >= periodMs) buckets.delete(key);
    }
    const bucket = buckets.get(ip) ?? { tokens: capacity, updatedAt: now };
    bucket.tokens = Math.min(capacity, bucket.tokens + Math.max(0, now - bucket.updatedAt) * capacity / periodMs);
    bucket.updatedAt = now;
    if (bucket.tokens < 1) {
      buckets.set(ip, bucket);
      return Response.json({ error: 'Too many requests.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((1 - bucket.tokens) * periodMs / capacity / 1000)) },
      });
    }
    // Keep memory bounded even when many distinct IPs visit a long-lived process.
    if (!buckets.has(ip) && buckets.size >= 10_000) {
      return Response.json({ error: 'Too many requests.' }, {
        status: 429, headers: { 'Retry-After': String(Math.ceil(periodMs / 1000)) },
      });
    }
    bucket.tokens -= 1;
    buckets.set(ip, bucket);
    return null;
  };
}

export class InvalidPayload extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<Record<string, unknown>> {
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > maxBytes) {
    throw new InvalidPayload(413, 'Request body is too large.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new InvalidPayload(400, 'Invalid JSON body.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        void reader.cancel().catch(() => {});
        throw new InvalidPayload(413, 'Request body is too large.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const body: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!isRecord(body)) throw new Error('Expected an object');
    return body;
  } catch {
    throw new InvalidPayload(400, 'Invalid JSON body.');
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

export function isText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
}
