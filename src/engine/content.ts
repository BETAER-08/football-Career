import { ALL_EVENTS } from '../data/events';
import { ALL_ACTIONS } from '../data/actions';
import { loadEvents, eventsLoaded } from './events';
import { loadActions } from './actions';
import './handlers';
import './actionHandlers';

export function ensureContent(): void {
  if (eventsLoaded()) return;
  loadEvents(ALL_EVENTS);
  loadActions(ALL_ACTIONS);
}
