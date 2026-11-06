import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import { record } from './model';

export const realtimeAvailable = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
export function eventClient() {
  if (!realtimeAvailable) return null;
  try {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  } catch { return null; }
}
export function send(channel: RealtimeChannel, payload: Record<string, unknown>) {
  // Never fall back to an HTTP broadcast when disconnected.
  if (channel.state === 'joined') void channel.send({ type: 'broadcast', event: 'event', payload }).catch(() => {});
}
export function members(channel: RealtimeChannel): Record<string, unknown>[] {
  return Object.values(channel.presenceState()).flat().filter(record);
}
