import { parentPort } from 'node:worker_threads';
import { runBatch, type Spec } from './headless';
import type { Calibration } from './calibration';

if (parentPort) {
  const port = parentPort;
  port.on('message', (msg: { id: number; specs: Spec[]; cal: Partial<Calibration> }) => {
    const res = runBatch(msg.specs, msg.cal);
    port.postMessage({ id: msg.id, res });
  });
}
