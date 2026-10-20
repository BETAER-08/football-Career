import type { RawEvent } from '../schema';
import { engineEvents } from './pro/engine';
import { youthPassive } from './youth/passive';
import { youthChoice } from './youth/choice';
import { youthStages } from './youth/stages';
import { youthLeague } from './youth/league';
import { youthSchool } from './youth/school';
import { lowerLeague } from './pro/lower';
import { faceEvents } from './pro/faces';
import { followups } from './followups';
import { flavorEvents } from './pro/flavor';
import { coachNonManager } from './coach/nonmanager';
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
import { milestoneEvents } from './postcareer/milestones';

export const ALL_EVENTS: RawEvent[] = [
  ...engineEvents, ...youthPassive, ...youthChoice, ...youthStages, ...youthLeague, ...youthSchool, ...lowerLeague, ...faceEvents, ...followups, ...flavorEvents, ...proPassive, ...proChoice1, ...proChoice2, ...chains1, ...chains2, ...moments, ...lifestyleEvents,
  ...coachPassive, ...coachChoice, ...coachNonManager, ...postPassive, ...postChoice, ...milestoneEvents
];
