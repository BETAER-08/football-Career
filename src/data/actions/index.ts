import type { RawAction } from '../schema';
import { moneyActions } from './money';
import { careerActions } from './career';
import { lifeActions } from './life';

export const ALL_ACTIONS: RawAction[] = [...moneyActions, ...careerActions, ...lifeActions];
