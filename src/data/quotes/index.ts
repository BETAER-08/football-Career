import { Q1 } from './q1';
import { Q2 } from './q2';
import { Q3 } from './q3';
import { Q4 } from './q4';
import type { QuoteRow } from './types';

export type { Persona, QuoteRow, QuoteWho } from './types';

export const QUOTES: readonly QuoteRow[] = [...Q1, ...Q2, ...Q3, ...Q4];
