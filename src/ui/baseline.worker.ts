import { runOne, type Spec } from '../engine/headless';

interface Msg { country: string; level: number; pos: Spec['pos']; n: number; seed: string }

self.onmessage = (e: MessageEvent<Msg>) => {
  const m = e.data;
  const scores: number[] = [];
  for (let i = 0; i < m.n; i++) {
    const r = runOne({ seed: `${m.seed}|base|${i}`, country: m.country, level: m.level, pos: m.pos, mode: 'player' });
    scores.push(r.debuted ? r.score : 0);
    if (i % 20 === 19) (self as unknown as Worker).postMessage({ progress: (i + 1) / m.n });
  }
  (self as unknown as Worker).postMessage({ done: true, scores });
};
