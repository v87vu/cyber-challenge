import { admit, applyProgress, eventInfo, PRESENTER_KEY, record, validInfo, type EventSession } from './model';
import { eventClient, members, send } from './realtime';

export type HostStatus = 'connecting' | 'ready' | 'offline' | 'occupied' | 'unavailable';
type Callbacks = {
  change: (session: EventSession) => void;
  count: (count: number) => void;
  status: (status: HostStatus) => void;
  storageError: () => void;
};

/** A presenter is the only writer. Presence is connectivity, never admission. */
export function connectHost(initial: EventSession, callbacks: Callbacks) {
  const client = eventClient();
  if (!client) return null;
  const session: EventSession = structuredClone(initial);
  const hostId = crypto.randomUUID();
  const startedAt = Date.now();
  const channel = client.channel(`event:${session.code}`, { config: { broadcast: { self: false }, presence: { key: hostId } } });
  let closed = false;
  let active = false;
  let probing = false;
  let seenHost = false;
  let presenceReady = false;
  let probeTimer: ReturnType<typeof setTimeout> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const announce = () => send(channel, { kind: 'state', code: session.code, info: eventInfo(session) });
  const persist = () => {
    try { localStorage.setItem(PRESENTER_KEY, JSON.stringify(session)); } catch { callbacks.storageError(); }
    callbacks.change(structuredClone(session));
  };
  const close = () => {
    closed = true;
    clearTimeout(probeTimer);
    clearTimeout(deadline);
    clearInterval(heartbeat);
    void client.removeChannel(channel);
    client.realtime.disconnect();
  };
  const occupied = () => { if (!closed) { callbacks.status('occupied'); close(); } };
  const sync = () => {
    if (closed) return;
    const presence = members(channel);
    // Same eventId = this browser's own presenter from before a refresh (the id lives only in this browser's storage), not a rival.
    const otherHosts = presence.filter((p) => p.role === 'presenter' && p.hostId !== hostId && p.eventId !== session.id);
    if (!active && otherHosts.length) seenHost = true;
    // Deterministic ordering also resolves two presenters claiming a code simultaneously.
    if (active && otherHosts.some((p) => typeof p.startedAt !== 'number' || p.startedAt < startedAt ||
      (p.startedAt === startedAt && String(p.hostId) < hostId))) { occupied(); return; }
    const ids = new Set(presence.filter((p) => p.role === 'player' && p.eventId === session.id && p.code === session.code &&
      session.players.some((player) => player.id === p.playerId)).map((p) => p.playerId));
    callbacks.count(ids.size);
    if (active) announce();
  };
  const deadline = setTimeout(() => { if (!active && !closed) { callbacks.status('unavailable'); close(); } }, 12000);
  channel.on('broadcast', { event: 'event' }, ({ payload }) => {
    if (closed || !record(payload) || payload.code !== session.code) return;
    if (!active) { if (payload.kind === 'state' && validInfo(payload.info) && payload.info.code === session.code && payload.info.id !== session.id) seenHost = true; return; }
    if (payload.kind === 'hello') { announce(); return; }
    if (payload.eventId !== session.id) return;
    if (payload.kind === 'join') {
      const result = admit(session, payload.player);
      if (typeof result === 'string') {
        if (record(payload.player) && typeof payload.player.id === 'string')
          send(channel, { kind: 'rejected', code: session.code, eventId: session.id, playerId: payload.player.id, reason: result });
      } else {
        persist();
        send(channel, { kind: 'admitted', code: session.code, eventId: session.id, player: result });
        sync();
      }
      announce();
    } else if (payload.kind === 'progress' && applyProgress(session, payload.player)) persist();
  }).on('presence', { event: 'sync' }, () => { presenceReady = true; sync(); }).subscribe(async (status) => {
    if (closed) return;
    if (status === 'SUBSCRIBED') {
      if (active) {
        await channel.track({ role: 'presenter', code: session.code, eventId: session.id, hostId, startedAt });
        if (closed) return;
        callbacks.status('ready'); sync(); announce(); return;
      }
      if (probing) return;
      probing = true;
      send(channel, { kind: 'hello', code: session.code, playerId: hostId });
      // Wait for both presence sync and an existing host's broadcast response.
      const claim = async () => {
        if (closed) return;
        if (!presenceReady) { probeTimer = setTimeout(claim, 250); return; }
        sync();
        if (seenHost) { occupied(); return; }
        active = true;
        const result = await channel.track({ role: 'presenter', code: session.code, eventId: session.id, hostId, startedAt });
        if (closed) return;
        if (result !== 'ok') { callbacks.status('unavailable'); close(); return; }
        clearTimeout(deadline);
        sync();
        if (closed) return;
        persist(); callbacks.status('ready'); announce();
        heartbeat = setInterval(announce, 3000);
      };
      probeTimer = setTimeout(claim, 1300);
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      callbacks.count(0);
      callbacks.status(active ? 'offline' : 'unavailable');
      if (!active) close();
    }
  });
  return {
    close,
    end: () => { if (active && !closed) { session.ended = true; persist(); announce(); } },
  };
}
