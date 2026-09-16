/* مؤثرات صوتية 8‑بت مُولَّدة في المتصفّح — بلا أي ملفات صوتية */

let ac: AudioContext | null = null;
let muted = false;

if (typeof window !== 'undefined') {
  try {
    muted = localStorage.getItem('dac-muted') === '1';
  } catch {}
}

export function isMuted() {
  return muted;
}

export function setMuted(v: boolean) {
  muted = v;
  try {
    localStorage.setItem('dac-muted', v ? '1' : '0');
  } catch {}
}

export function loadMuted() {
  try {
    muted = localStorage.getItem('dac-muted') === '1';
  } catch {}
  return muted;
}

function ctx() {
  try {
    if (typeof window === 'undefined') return null;
    if (!ac) {
      const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!C) return null;
      ac = new C();
    }
    if (ac.state === 'suspended') void ac.resume();
    return ac;
  } catch {
    return null;
  }
}

type Note = [freq: number, start: number, dur: number];

function play(notes: Note[], type: OscillatorType = 'square', vol = 0.07) {
  try {
    if (muted) return;
    const a = ctx();
    if (!a) return;
  const t0 = a.currentTime;
  for (const [freq, start, dur] of notes) {
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0 + start);
    g.gain.setValueAtTime(0, t0 + start);
    g.gain.linearRampToValueAtTime(vol, t0 + start + 0.008);
    g.gain.setValueAtTime(vol, t0 + start + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
    osc.connect(g).connect(a.destination);
    osc.start(t0 + start);
    osc.stop(t0 + start + dur + 0.02);
  }
  } catch {
    /* الصوت تحسيني — لا يعطّل اللعبة أبداً */
  }
}

const N = { C4: 262, E4: 330, G4: 392, A4: 440, C5: 523, D5: 587, E5: 659, G5: 784, C6: 1047 };

/* اهتزاز خفيف حيث يدعمه الجهاز — مستقل عن كتم الصوت */
function buzz(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
  } catch {}
}

export const sfx = {
  select: () => play([[N.E5, 0, 0.05]], 'triangle', 0.05),
  confirm: () => play([[N.G4, 0, 0.05], [N.C5, 0.05, 0.07]], 'triangle', 0.06),
  correct: () => {
    buzz(25);
    play([
      [N.C5, 0, 0.07],
      [N.E5, 0.07, 0.07],
      [N.G5, 0.14, 0.14],
    ]);
  },
  wrong: () => {
    buzz([60, 40, 120]);
    play(
      [
        [220, 0, 0.11],
        [165, 0.11, 0.11],
        [110, 0.22, 0.24],
      ],
      'sawtooth',
      0.08,
    );
  },
  levelup: () => {
    buzz([20, 30, 20]);
    play([
      [N.C5, 0, 0.06],
      [N.E5, 0.06, 0.06],
      [N.G5, 0.12, 0.06],
      [N.C6, 0.18, 0.2],
    ]);
  },
  win: () => {
    buzz([40, 60, 40, 60, 140]);
    play([
      [N.C5, 0, 0.1],
      [N.E5, 0.1, 0.1],
      [N.G5, 0.2, 0.1],
      [N.C6, 0.3, 0.12],
      [N.G5, 0.44, 0.08],
      [N.C6, 0.54, 0.34],
    ]);
  },
  tick: () => play([[880, 0, 0.03]], 'triangle', 0.045),
  /* دحرجة طبول متسارعة تسبق السؤال الذهبي */
  drumroll: () => {
    buzz([15, 120, 15, 100, 15, 80, 15, 60, 15, 40, 25]);
    const notes: Note[] = [];
    let t = 0;
    let gap = 0.22;
    while (t < 1.9) {
      notes.push([196, t, 0.05]);
      t += gap;
      gap = Math.max(0.055, gap * 0.86);
    }
    notes.push([N.C5, 2.0, 0.09], [N.E5, 2.09, 0.09], [N.G5, 2.18, 0.22]);
    play(notes, 'square', 0.05);
  },
  start: () => play([[N.C4, 0, 0.06], [N.G4, 0.06, 0.06], [N.C5, 0.12, 0.14]]),
};

/* اشتراك خارجي لحالة الكتم — يتجنّب setState داخل useEffect */
const listeners = new Set<() => void>();

export function subscribeMuted(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function mutedSnapshot() {
  return muted;
}

export function mutedServerSnapshot() {
  return false;
}

export function toggleMuted() {
  setMuted(!muted);
  listeners.forEach((l) => l());
}
