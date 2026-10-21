import type { VariantTable } from './types';
import { V01 } from './v01';
import { V02 } from './v02';
import { V03 } from './v03';
import { V04 } from './v04';
import { V05 } from './v05';

export type { EventVariants, VariantTable } from './types';

export const EVENT_VARIANTS: VariantTable = { ...V01, ...V02, ...V03, ...V04, ...V05 };
