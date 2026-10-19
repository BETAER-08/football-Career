import type { RawEvent } from '../schema';
import { engineEvents } from './pro/engine';
import { youthPassive } from './youth/passive';
import { youthChoice } from './youth/choice';
import { proPassive } from './pro/passive';
import { proChoice1 } from './pro/choice1';
import { proChoice2 } from './pro/choice2';
import { chains1 } from './pro/chains1';
import { chains2 } from './pro/chains2';
import { moments } from './pro/moments';
import { lifestyleEvents } from './pro/lifestyle';
import { coachPassive } from './coach/passive';
import { coachChoice } from './coach/choice';
import { postPassive } from './postcareer/passive';
import { postChoice } from './postcareer/choice';

export const ALL_EVENTS: RawEvent[] = [
  ...engineEvents, ...youthPassive, ...youthChoice, ...proPassive, ...proChoice1, ...proChoice2, ...chains1, ...chains2, ...moments, ...lifestyleEvents,
  ...coachPassive, ...coachChoice, ...postPassive, ...postChoice
];
