import type { RealtimeChannel } from '@supabase/supabase-js';
import { cleanNickname, record, validCode, validInfo, validPlayer, type EventInfo, type Player } from './model';
import { eventClient, members, send } from './realtime';

type Status = 'connecting' | 'ready' | 'joining' | 'joined' | 'unavailable' | 'unknown' | 'full' | 'ended' | 'invalid';
type View = { status: Status; info: EventInfo | null; player: Player | null };
const INITIAL: View = { status: 'connecting', info: null, player: null };

export class EventPlayer {
  private view: View = INITIAL;
  private listeners = new Set<() => void>();
  private channel: RealtimeChannel | null = null;
  private identity = '';
  private pending: Player | null = null;
  private restored = false;
  private lastState = 0;
  private startedAt = 0;
  private baseElapsed = 0;
  private correct = 0;
  private finished = false;
  private elapsed = 0;
  private joiningAt = 0;
  private lastPublishedAt = 0;
  private lastPublishedCorrect = -1;
  private lastPublishedFinished = false;
  constructor(readonly code: string) {}
  subscribe = (callback: () => void) => { this.listeners.add(callback); return () => { this.listeners.delete(callback); }; };
  snapshot = () => this.view;
  serverSnapshot = () => INITIAL;
  private emit(patch: Partial<View>) {
    this.view = { ...this.view, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  private storageKey() { return `dac-event-player-${this.code}`; }
  connect() {
    const client = validCode(this.code) ? eventClient() : null;
    if (!client) { this.emit({ status: 'unavailable' }); return () => {}; }
    this.identity = crypto.randomUUID();
    const channel = client.channel(`event:${this.code}`, { config: { broadcast: { self: false }, presence: { key: this.identity } } });
    this.channel = channel;
    let alive = true;
    this.lastState = Date.now();
    channel.on('broadcast', { event: 'event' }, ({ payload }) => {
      if (!alive || !record(payload) || payload.code !== this.code) return;
      if (payload.kind === 'state') {
        if (!validInfo(payload.info) || payload.info.code !== this.code) return;
        const info = payload.info;
        // Only discover an event whose presenter is actually present on this code.
        if (!members(channel).some((p) => p.role === 'presenter' && p.eventId === info.id && p.code === this.code)) return;
        if (this.view.info && this.view.info.id !== info.id) return;
        this.lastState = Date.now();
        if (this.view.info?.ended) return;
        const rejected = this.view.status === 'full' || this.view.status === 'invalid';
        this.emit({ info, status: info.ended ? 'ended' : this.view.player ? 'joined' : this.pending ? 'joining' : rejected ? this.view.status : 'ready' });
        if (info.ended) return;
        if (!this.view.player && !this.pending && !this.restored) {
          this.restored = true;
          try {
            const saved: unknown = JSON.parse(sessionStorage.getItem(this.storageKey()) || 'null');
            if (record(saved) && saved.eventId === info.id && validPlayer(saved.player)) {
              this.identity = saved.player.id;
              this.pending = saved.player;
              this.joiningAt = Date.now();
            }
          } catch { /* Storage is optional for players. */ }
        }
        if (this.pending) this.requestJoin();
      } else if (payload.eventId === this.view.info?.id && payload.kind === 'admitted') {
        if (!validPlayer(payload.player) || payload.player.id !== this.identity || !this.pending || this.view.info?.ended) return;
        const player = payload.player;
        if (player.teamId !== this.pending.teamId || player.nickname !== this.pending.nickname || player.total !== this.pending.total) return;
        this.pending = null;
        this.baseElapsed = player.elapsed;
        this.correct = Math.max(this.correct, player.correct);
        this.finished = player.finished;
        this.elapsed = player.elapsed;
        this.emit({ player, status: 'joined' });
        try { sessionStorage.setItem(this.storageKey(), JSON.stringify({ eventId: this.view.info!.id, player })); } catch {}
        void channel.track({ role: 'player', eventId: this.view.info!.id, code: this.code, playerId: this.identity });
      } else if (payload.eventId === this.view.info?.id && payload.kind === 'rejected' && payload.playerId === this.identity && !this.view.info?.ended) {
        if (payload.reason === 'full' || payload.reason === 'ended' || payload.reason === 'invalid') {
          this.pending = null;
          if (payload.reason === 'invalid') {
            try { sessionStorage.removeItem(this.storageKey()); } catch {}
          }
          this.emit({ status: payload.reason, ...(payload.reason === 'ended' && this.view.info ? { info: { ...this.view.info, ended: true } } : {}) });
        }
      }
    }).on('presence', { event: 'sync' }, () => { this.lastState = Math.max(this.lastState, 0); }).subscribe((status) => {
      if (!alive) return;
      if (status === 'SUBSCRIBED') {
        send(channel, { kind: 'hello', code: this.code, playerId: this.identity });
        if (this.view.player && this.view.info) {
          void channel.track({ role: 'player', eventId: this.view.info.id, code: this.code, playerId: this.identity });
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') this.emit({ status: 'unavailable' });
    });
    const timer = setInterval(() => {
      if (!this.view.info?.ended) {
        if (!this.view.info || Date.now() - this.lastState > 6000) send(channel, { kind: 'hello', code: this.code, playerId: this.identity });
        if (Date.now() - this.lastState > 10000) this.emit({ status: this.view.info ? 'unavailable' : 'unknown' });
        else if (this.pending && Date.now() - this.joiningAt > 10000) this.emit({ status: 'unavailable' });
        this.publish();
      }
    }, 3000);
    return () => {
      alive = false;
      clearInterval(timer);
      this.channel = null;
      void client.removeChannel(channel);
    };
  }
  join(teamId: string, nickname: string, total: number) {
    const info = this.view.info;
    const filtered = cleanNickname(nickname);
    if (!info || info.ended || !filtered || !info.teams.some((t) => t.id === teamId) || (total !== 10 && total !== 22)) {
      this.emit({ status: 'invalid' }); return;
    }
    if (this.view.player) return;
    this.pending = { id: this.identity, teamId, nickname: filtered, total, correct: 0, finished: false, elapsed: 0 };
    this.joiningAt = Date.now();
    this.emit({ status: 'joining' });
    this.requestJoin();
  }
  private requestJoin() {
    if (this.channel && this.view.info && this.pending) send(this.channel, { kind: 'join', code: this.code, eventId: this.view.info.id, player: this.pending });
  }
  updateQuiz(correct: number, finished: boolean, running: boolean) {
    if (!this.view.player || this.view.info?.ended || this.finished) return;
    if (running && !this.startedAt) this.startedAt = Date.now();
    this.correct = Math.max(this.correct, correct);
    this.finished = finished;
    this.publish();
  }
  private publish() {
    const { info, player } = this.view;
    if (!this.channel || !info || info.ended || !player || !this.startedAt) return;
    if (this.correct === this.lastPublishedCorrect && this.finished === this.lastPublishedFinished && Date.now() - this.lastPublishedAt < 15000) return;
    this.lastPublishedAt = Date.now();
    this.lastPublishedCorrect = this.correct;
    this.lastPublishedFinished = this.finished;
    if (!this.finished || !player.finished) {
      this.elapsed = Math.min(86400, this.baseElapsed + Math.round((Date.now() - this.startedAt) / 1000));
    }
    const progress = { ...player, correct: this.correct, finished: this.finished, elapsed: this.elapsed };
    // Keep the last completed time fixed when retrying broadcasts after reconnect.
    this.emit({ player: progress });
    send(this.channel, { kind: 'progress', code: this.code, eventId: info.id, player: progress });
  }
}
