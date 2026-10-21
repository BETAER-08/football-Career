import './app.css';
import { mount } from 'svelte';
import App from './ui/App.svelte';
import { store } from './ui/store.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('app root missing');

async function boot(root: HTMLElement) {
  if (import.meta.env.DEV && location.pathname === '/dev/avatars') {
    const m = await import('./dev/AvatarSheet.svelte');
    mount(m.default, { target: root });
    return;
  }
  if (import.meta.env.DEV && location.pathname === '/dev/ui') {
    const f = await import('./dev/fixtures');
    const name = (new URLSearchParams(location.search).get('state') ?? 'youth') as import('./dev/fixtures').FixtureName;
    store.prefs.tutorialSeen = true;
    store.game = f.buildFixture(name);
    store.screen = 'game';
    if (name === 'modals') {
      const g = store.game;
      store.pushModal({ key: 'dev:squad', kind: 'squad', stage: 'called' });
      store.pushModal({ key: 'dev:age', kind: 'age', rec: { year: g.week > 0 ? 2028 : 2027, id: 'u17wc', name: 'U-17 월드컵', result: '8강 진출', apps: 5, goals: 2, assists: 1, awards: ['조별리그 최우수 선수'] } });
    }
    mount(App, { target: root });
    return;
  }
  mount(App, { target: root });
}

void boot(target);
