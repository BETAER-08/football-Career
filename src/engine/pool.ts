import { Worker } from 'node:worker_threads';
import { cpus } from 'node:os';
import type { Spec, CareerResult } from './headless';
import type { Calibration } from './calibration';

export interface Pool {
  run(specs: Spec[], cal: Partial<Calibration>): Promise<CareerResult[]>;
  close(): Promise<void>;
}

export function createPool(n = Math.max(1, Math.min(12, cpus().length - 1))): Pool {
  const workers: Worker[] = [];
  for (let i = 0; i < n; i++) workers.push(new Worker(new URL('./headlessBoot.mjs', import.meta.url)));
  let seq = 0;
  return {
    async run(specs, cal) {
      const chunk = Math.ceil(specs.length / workers.length);
      const parts: Promise<CareerResult[]>[] = [];
      workers.forEach((w, i) => {
        const slice = specs.slice(i * chunk, (i + 1) * chunk);
        if (!slice.length) return;
        parts.push(new Promise((resolve, reject) => {
          const id = ++seq;
          const onMsg = (m: { id: number; res: CareerResult[] }) => {
            if (m.id !== id) return;
            w.off('message', onMsg);
            w.off('error', reject);
            resolve(m.res);
          };
          w.on('message', onMsg);
          w.once('error', reject);
          w.postMessage({ id, specs: slice, cal });
        }));
      });
      return (await Promise.all(parts)).flat();
    },
    async close() {
      await Promise.all(workers.map((w) => w.terminate()));
    }
  };
}
