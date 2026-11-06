export const MAX_PLAYERS = 200;
export const PRESENTER_KEY = 'dac-event-presenter-v1';
export type Team = { id: string; name: string };
export type Progress = { correct: number; total: number; finished: boolean; elapsed: number };
export type Player = Progress & { id: string; teamId: string; nickname: string };
export type EventInfo = { id: string; code: string; teams: Team[]; ended: boolean };
export type EventSession = EventInfo & { players: Player[] };

export function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9-]{8,80}$/.test(value);
}
export function validCode(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}$/.test(value);
}
// Letters and spaces only: no links, phone numbers, handles, controls or markup.
export function cleanNickname(value: unknown): string {
  if (typeof value !== 'string') return '';
  const text = value.normalize('NFKC').trim().replace(/\s+/gu, ' ');
  if (!text || [...text].length > 16 || !/^[\p{L}\p{M} ]+$/u.test(text)) return '';
  const folded = text.toLowerCase().normalize('NFKD').replace(/[\p{M}\sـ]/gu, '').replace(/[أإآ]/gu, 'ا');
  if (/fuck|shit|bitch|asshole|cunt|كسام|كسم|شرموط|قحب|منيوك|زب|چوت|گاند|بھڑو|حرامی|حرامي/.test(folded)) return '';
  return text;
}
export function validTeams(value: unknown): value is Team[] {
  return Array.isArray(value) && value.length >= 2 && value.length <= 6 &&
    value.every((t) => record(t) && typeof t.id === 'string' && /^team-[1-6]$/.test(t.id) &&
      typeof t.name === 'string' && t.name.trim() === t.name && t.name.length > 0 && t.name.length <= 32 &&
      /^[\p{L}\p{M}\p{N} -]+$/u.test(t.name)) &&
    new Set(value.map((t) => t.id)).size === value.length &&
    new Set(value.map((t) => t.name.toLowerCase())).size === value.length;
}
export function validInfo(value: unknown): value is EventInfo {
  return record(value) && validId(value.id) && validCode(value.code) && validTeams(value.teams) && typeof value.ended === 'boolean';
}
export function validProgress(value: unknown): value is Progress {
  return record(value) && (value.total === 10 || value.total === 22) &&
    Number.isInteger(value.correct) && Number(value.correct) >= 0 && Number(value.correct) <= value.total &&
    Number.isInteger(value.elapsed) && Number(value.elapsed) >= 0 && Number(value.elapsed) <= 86400 &&
    typeof value.finished === 'boolean' && (!value.finished || value.correct === value.total);
}
export function validPlayer(value: unknown): value is Player {
  return record(value) && validId(value.id) && typeof value.teamId === 'string' &&
    cleanNickname(value.nickname) === value.nickname && value.nickname !== '' && validProgress(value);
}
export function validSession(value: unknown): value is EventSession {
  return validInfo(value) && 'players' in value && Array.isArray(value.players) && value.players.length <= MAX_PLAYERS &&
    value.players.every((p) => validPlayer(p) && value.teams.some((t) => t.id === p.teamId)) &&
    new Set(value.players.map((p) => p.id)).size === value.players.length;
}
export function eventInfo(session: EventSession): EventInfo {
  return { id: session.id, code: session.code, teams: session.teams, ended: session.ended };
}
export function admit(session: EventSession, value: unknown): Player | 'full' | 'ended' | 'invalid' {
  if (session.ended) return 'ended';
  if (!validPlayer(value) || !session.teams.some((t) => t.id === value.teamId)) return 'invalid';
  const existing = session.players.find((p) => p.id === value.id);
  // An admitted identity cannot change team, nickname or quiz size.
  if (existing) return existing.teamId === value.teamId && existing.nickname === value.nickname && existing.total === value.total ? existing : 'invalid';
  if (session.players.length >= MAX_PLAYERS) return 'full';
  const player = { id: value.id, teamId: value.teamId, nickname: value.nickname, total: value.total, correct: 0, finished: false, elapsed: 0 };
  session.players.push(player);
  return player;
}
export function applyProgress(session: EventSession, value: unknown): boolean {
  if (session.ended || !validPlayer(value)) return false;
  const player = session.players.find((p) => p.id === value.id);
  if (!player || player.finished || player.teamId !== value.teamId || player.nickname !== value.nickname || player.total !== value.total ||
    value.correct < player.correct || value.elapsed < player.elapsed) return false;
  Object.assign(player, { correct: value.correct, elapsed: value.elapsed, finished: value.finished });
  return true;
}
export function leaderboard(session: EventSession) {
  return session.teams.map((team) => {
    const players = session.players.filter((p) => p.teamId === team.id);
    const count = players.length;
    return {
      ...team, count,
      average: count ? players.reduce((n, p) => n + p.correct / p.total * 100, 0) / count : 0,
      progress: count ? players.filter((p) => p.finished).length / count * 100 : 0,
      time: count ? players.reduce((n, p) => n + p.elapsed, 0) / count : 0,
    };
  }).sort((a, b) => b.average - a.average || a.time - b.time || a.id.localeCompare(b.id));
}
