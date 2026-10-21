import type { EventVariants, VariantTable } from './types';
import { V01 } from './v01';
import { V02 } from './v02';
import { V03 } from './v03';
import { V04 } from './v04';
import { V05 } from './v05';
import { V06 } from './v06';
import { V07 } from './v07';
import { V08 } from './v08';

export type { EventVariants, VariantTable } from './types';

function mergeOne(a: EventVariants | undefined, b: EventVariants): EventVariants {
  if (!a) return b;
  const o: Record<string, string[]> = { ...(a.o ?? {}) };
  for (const [k, v] of Object.entries(b.o ?? {})) o[k] = [...(o[k] ?? []), ...v];
  const t = [...(a.t ?? []), ...(b.t ?? [])];
  const tb = [...(a.tb ?? []), ...(b.tb ?? [])];
  const out: EventVariants = { o };
  if (t.length) out.t = t;
  if (tb.length) out.tb = tb;
  return out;
}

function mergeTables(tables: VariantTable[]): VariantTable {
  const out: VariantTable = {};
  for (const table of tables) {
    for (const [id, v] of Object.entries(table)) out[id] = mergeOne(out[id], v);
  }
  return out;
}

export const EVENT_VARIANTS: VariantTable = mergeTables([V01, V02, V03, V04, V05, V06, V07, V08]);
